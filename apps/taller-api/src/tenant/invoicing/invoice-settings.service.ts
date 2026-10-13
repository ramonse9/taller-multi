import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { normalizeAndValidateSchemaName, quoteIdentifier } from '../../database/schema-name';
import {
  COMPANY_RFC_PATTERN,
  GENERIC_RFCS,
  PERSON_RFC_PATTERN,
  RFC_PATTERN,
} from '../clients/rfc-validation';
import { TenantSessionService } from '../tenant-session.service';
import {
  ChangeInvoiceModeDto,
  InvoiceMode,
  InvoiceSettingsResponseDto,
  IssuerReadinessIssueCode,
  IssuerReadinessMissingCode,
  IssuerReadinessResponseDto,
  IssuerType,
  PlatformInvoiceModeResponseDto,
  UpdateInvoiceSettingsDto,
} from './dto/invoice-settings.dto';

interface InvoiceSettingsRow {
  mode: InvoiceMode;
  fiscal_name: string | null;
  tax_id: string | null;
  fiscal_regime_code: string | null;
  fiscal_regime_name: string | null;
  fiscal_regime_exists: boolean;
  fiscal_regime_active: boolean;
  fiscal_regime_supports_issuer_type: boolean;
  fiscal_postal_code: string | null;
  default_series: string;
  next_internal_folio: string;
  prices_include_tax: boolean | null;
  currency_code: 'MXN';
  is_active: boolean;
  updated_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
  person_type_code: string;
}

interface CompanySchemaRow {
  id: string;
  schema_name: string;
  is_active: boolean;
}

@Injectable()
export class InvoiceSettingsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenant: TenantSessionService,
  ) {}

  getForTenant(user: AuthenticatedUser): Promise<InvoiceSettingsResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const row = await this.findSettings(runner, schema, user.companyId!);
      return this.toResponse(row);
    });
  }

  updateForTenant(
    user: AuthenticatedUser,
    input: UpdateInvoiceSettingsDto,
  ): Promise<InvoiceSettingsResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const current = await this.findSettings(runner, schema, user.companyId!, true);
      const merged = await this.withCurrentRegimeState(runner, this.merge(current, input));
      const readiness = this.calculateReadiness(merged);
      if (readiness.validationIssues.length > 0) {
        throw new BadRequestException({
          message: 'La configuración fiscal del emisor contiene datos inválidos',
          validationIssues: readiness.validationIssues,
        });
      }

      const changes = this.changedValues(current, merged);
      if (changes.fields.length === 0) return this.toResponse(current);

      const table = `${quoteIdentifier(schema)}.invoice_settings`;
      await runner.query(
        `UPDATE ${table} SET
           fiscal_name = $1, tax_id = $2, fiscal_regime_code = $3,
           fiscal_postal_code = $4, default_series = $5, next_internal_folio = $6,
           prices_include_tax = $7, is_active = $8,
           updated_by_user_id = $9, updated_at = now()
         WHERE id = 1`,
        [
          merged.fiscal_name,
          merged.tax_id,
          merged.fiscal_regime_code,
          merged.fiscal_postal_code,
          merged.default_series,
          Number(merged.next_internal_folio),
          merged.prices_include_tax,
          merged.is_active,
          user.id,
        ],
      );
      await this.recordEvent(
        runner,
        schema,
        'profile_updated',
        changes.fields,
        changes.previous,
        changes.next,
        user.id,
      );
      return this.toResponse(await this.findSettings(runner, schema, user.companyId!));
    });
  }

  async getPlatformMode(companyId: string): Promise<PlatformInvoiceModeResponseDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const company = await this.findCompany(runner, companyId);
      const schema = normalizeAndValidateSchemaName(company.schema_name);
      return this.toPlatformResponse(companyId, await this.findSettings(runner, schema, companyId));
    } finally {
      await runner.release();
    }
  }

  async changePlatformMode(
    actor: AuthenticatedUser,
    companyId: string,
    input: ChangeInvoiceModeDto,
  ): Promise<PlatformInvoiceModeResponseDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const company = await this.findCompany(runner, companyId, true);
      if (input.mode === InvoiceMode.Simulation) {
        if (!company.is_active) throw new ForbiddenException('La compañía está inactiva');
        await this.assertInvoicingPlan(runner, companyId);
      }
      const schema = normalizeAndValidateSchemaName(company.schema_name);
      const current = await this.findSettings(runner, schema, companyId, true);
      if (current.mode !== input.mode) {
        await runner.query(
          `UPDATE ${quoteIdentifier(schema)}.invoice_settings
           SET mode = $1, updated_by_user_id = $2, updated_at = now() WHERE id = 1`,
          [input.mode, actor.id],
        );
        await this.recordEvent(
          runner,
          schema,
          'mode_changed',
          ['mode'],
          { mode: current.mode },
          { mode: input.mode },
          actor.id,
        );
      }
      const response = this.toPlatformResponse(
        companyId,
        await this.findSettings(runner, schema, companyId),
      );
      await runner.commitTransaction();
      return response;
    } catch (error: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async findCompany(
    runner: QueryRunner,
    companyId: string,
    lock = false,
  ): Promise<CompanySchemaRow> {
    const rows = (await runner.query(
      `SELECT id, schema_name, is_active FROM public.companies
       WHERE id = $1${lock ? ' FOR UPDATE' : ''}`,
      [companyId],
    )) as CompanySchemaRow[];
    if (!rows[0]) throw new NotFoundException('Compañía no encontrada');
    return rows[0];
  }

  private async assertInvoicingPlan(runner: QueryRunner, companyId: string): Promise<void> {
    const rows = (await runner.query(
      `SELECT EXISTS(
         SELECT 1
         FROM public.company_subscriptions subscription
         JOIN public.subscription_plan_features feature
           ON feature.plan_code = subscription.plan_code
         WHERE subscription.company_id = $1
           AND subscription.status = 'active'
           AND feature.feature_code = 'invoicing'
       ) AS allowed`,
      [companyId],
    )) as Array<{ allowed: boolean }>;
    if (!rows[0]?.allowed) {
      throw new ForbiddenException(
        'La simulación de facturación requiere una suscripción Facturación activa',
      );
    }
  }

  private async findSettings(
    runner: QueryRunner,
    schema: string,
    companyId: string,
    lock = false,
  ): Promise<InvoiceSettingsRow> {
    const settings = `${quoteIdentifier(schema)}.invoice_settings`;
    const rows = (await runner.query(
      `SELECT settings.mode, settings.fiscal_name, settings.tax_id,
              settings.fiscal_regime_code, fiscal_regime.name AS fiscal_regime_name,
              fiscal_regime.code IS NOT NULL AS fiscal_regime_exists,
              COALESCE(fiscal_regime.is_active, false) AS fiscal_regime_active,
              COALESCE(
                CASE company.person_type_code
                  WHEN 'individual' THEN fiscal_regime.supports_person
                  WHEN 'legal_entity' THEN fiscal_regime.supports_company
                  ELSE false
                END,
                false
              ) AS fiscal_regime_supports_issuer_type,
              settings.fiscal_postal_code, settings.default_series,
              settings.next_internal_folio::text, settings.prices_include_tax,
              settings.currency_code, settings.is_active, settings.updated_by_user_id,
              settings.created_at, settings.updated_at, company.person_type_code
       FROM ${settings} settings
       JOIN public.companies company ON company.id = $1
       LEFT JOIN public.sat_fiscal_regimes fiscal_regime
         ON fiscal_regime.code = settings.fiscal_regime_code
       WHERE settings.id = 1${lock ? ' FOR UPDATE OF settings' : ''}`,
      [companyId],
    )) as InvoiceSettingsRow[];
    if (!rows[0]) {
      throw new NotFoundException('La configuración de facturación no está inicializada');
    }
    return rows[0];
  }

  private merge(current: InvoiceSettingsRow, input: UpdateInvoiceSettingsDto): InvoiceSettingsRow {
    return {
      ...current,
      fiscal_name: input.fiscalName === undefined ? current.fiscal_name : input.fiscalName,
      tax_id: input.taxId === undefined ? current.tax_id : input.taxId,
      fiscal_regime_code:
        input.fiscalRegimeCode === undefined
          ? current.fiscal_regime_code
          : input.fiscalRegimeCode,
      fiscal_postal_code:
        input.fiscalPostalCode === undefined
          ? current.fiscal_postal_code
          : input.fiscalPostalCode,
      default_series: input.defaultSeries ?? current.default_series,
      next_internal_folio:
        input.nextInternalFolio === undefined
          ? current.next_internal_folio
          : String(input.nextInternalFolio),
      prices_include_tax:
        input.pricesIncludeTax === undefined
          ? current.prices_include_tax
          : input.pricesIncludeTax,
      is_active: input.isActive ?? current.is_active,
    };
  }

  private calculateReadiness(row: InvoiceSettingsRow): IssuerReadinessResponseDto {
    const missingFields: IssuerReadinessResponseDto['missingFields'] = [];
    const validationIssues: IssuerReadinessResponseDto['validationIssues'] = [];
    const issuerType = this.issuerType(row.person_type_code);

    if (!issuerType) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.IssuerTypeUnsupported,
        field: 'issuerType',
        message: 'El tipo fiscal de la compañía no permite validar al emisor.',
      });
    }
    if (!row.fiscal_name?.trim()) {
      missingFields.push({
        code: IssuerReadinessMissingCode.FiscalNameRequired,
        field: 'fiscalName',
        message: `Falta ${issuerType === IssuerType.Person ? 'el nombre fiscal' : 'la razón social fiscal'} del emisor.`,
      });
    }

    const taxId = row.tax_id?.trim().toUpperCase() ?? null;
    if (!taxId) {
      missingFields.push({
        code: IssuerReadinessMissingCode.TaxIdRequired,
        field: 'taxId',
        message: 'Falta el RFC del emisor.',
      });
    } else if (!RFC_PATTERN.test(taxId)) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.TaxIdInvalid,
        field: 'taxId',
        message: 'El RFC del emisor tiene una estructura inválida.',
      });
    } else if (GENERIC_RFCS.has(taxId)) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.GenericTaxIdNotAllowed,
        field: 'taxId',
        message: 'Un RFC genérico no puede identificar al emisor.',
      });
    } else if (
      (issuerType === IssuerType.Person && !PERSON_RFC_PATTERN.test(taxId)) ||
      (issuerType === IssuerType.Company && !COMPANY_RFC_PATTERN.test(taxId))
    ) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.TaxIdIncompatible,
        field: 'taxId',
        message: `El RFC no corresponde a una ${issuerType === IssuerType.Person ? 'persona física' : 'persona moral'}.`,
      });
    }

    if (!row.fiscal_postal_code) {
      missingFields.push({
        code: IssuerReadinessMissingCode.FiscalPostalCodeRequired,
        field: 'fiscalPostalCode',
        message: 'Falta el código postal del lugar de expedición.',
      });
    } else if (!/^\d{5}$/.test(row.fiscal_postal_code)) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.FiscalPostalCodeInvalid,
        field: 'fiscalPostalCode',
        message: 'El código postal debe contener exactamente 5 dígitos.',
      });
    }

    if (!row.fiscal_regime_code) {
      missingFields.push({
        code: IssuerReadinessMissingCode.FiscalRegimeRequired,
        field: 'fiscalRegimeCode',
        message: 'Falta el régimen fiscal del emisor.',
      });
    } else if (!row.fiscal_regime_exists) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.FiscalRegimeNotFound,
        field: 'fiscalRegimeCode',
        message: 'El régimen fiscal del emisor no existe en el catálogo.',
      });
    } else if (!row.fiscal_regime_active) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.FiscalRegimeInactive,
        field: 'fiscalRegimeCode',
        message: 'El régimen fiscal del emisor está inactivo.',
      });
    } else if (!row.fiscal_regime_supports_issuer_type) {
      validationIssues.push({
        code: IssuerReadinessIssueCode.FiscalRegimeIncompatible,
        field: 'fiscalRegimeCode',
        message: 'El régimen fiscal no es compatible con el tipo de persona de la compañía.',
      });
    }

    return {
      isIssuerProfileComplete: missingFields.length === 0 && validationIssues.length === 0,
      missingFields,
      validationIssues,
    };
  }

  private async withCurrentRegimeState(
    runner: QueryRunner,
    row: InvoiceSettingsRow,
  ): Promise<InvoiceSettingsRow> {
    if (!row.fiscal_regime_code) {
      return {
        ...row,
        fiscal_regime_name: null,
        fiscal_regime_exists: false,
        fiscal_regime_active: false,
        fiscal_regime_supports_issuer_type: false,
      };
    }
    const regimes = (await runner.query(
      `SELECT name, is_active, supports_person, supports_company
       FROM public.sat_fiscal_regimes WHERE code = $1`,
      [row.fiscal_regime_code],
    )) as Array<{
      name: string;
      is_active: boolean;
      supports_person: boolean;
      supports_company: boolean;
    }>;
    const regime = regimes[0];
    if (!regime) {
      return {
        ...row,
        fiscal_regime_name: null,
        fiscal_regime_exists: false,
        fiscal_regime_active: false,
        fiscal_regime_supports_issuer_type: false,
      };
    }
    const issuerType = this.issuerType(row.person_type_code);
    return {
      ...row,
      fiscal_regime_name: regime.name,
      fiscal_regime_exists: true,
      fiscal_regime_active: regime.is_active,
      fiscal_regime_supports_issuer_type:
        issuerType === IssuerType.Person
          ? regime.supports_person
          : issuerType === IssuerType.Company
            ? regime.supports_company
            : false,
    };
  }

  private issuerType(personTypeCode: string): IssuerType | null {
    if (personTypeCode === 'individual') return IssuerType.Person;
    if (personTypeCode === 'legal_entity') return IssuerType.Company;
    return null;
  }

  private toResponse(row: InvoiceSettingsRow): InvoiceSettingsResponseDto {
    return {
      mode: row.mode,
      issuerType: this.issuerType(row.person_type_code),
      fiscalName: row.fiscal_name,
      taxId: row.tax_id,
      fiscalRegimeCode: row.fiscal_regime_code,
      fiscalRegimeName: row.fiscal_regime_name,
      fiscalPostalCode: row.fiscal_postal_code,
      defaultSeries: row.default_series,
      nextInternalFolio: Number(row.next_internal_folio),
      pricesIncludeTax: row.prices_include_tax,
      currencyCode: row.currency_code,
      isActive: row.is_active,
      readiness: this.calculateReadiness(row),
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toPlatformResponse(
    companyId: string,
    row: InvoiceSettingsRow,
  ): PlatformInvoiceModeResponseDto {
    return {
      companyId,
      mode: row.mode,
      isActive: row.is_active,
      isIssuerProfileComplete: this.calculateReadiness(row).isIssuerProfileComplete,
    };
  }

  private changedValues(
    current: InvoiceSettingsRow,
    next: InvoiceSettingsRow,
  ): {
    fields: string[];
    previous: Record<string, unknown>;
    next: Record<string, unknown>;
  } {
    const fields: Array<[string, keyof InvoiceSettingsRow]> = [
      ['fiscalName', 'fiscal_name'],
      ['taxId', 'tax_id'],
      ['fiscalRegimeCode', 'fiscal_regime_code'],
      ['fiscalPostalCode', 'fiscal_postal_code'],
      ['defaultSeries', 'default_series'],
      ['nextInternalFolio', 'next_internal_folio'],
      ['pricesIncludeTax', 'prices_include_tax'],
      ['isActive', 'is_active'],
    ];
    const changedFields: string[] = [];
    const previous: Record<string, unknown> = {};
    const nextValues: Record<string, unknown> = {};
    for (const [publicName, rowName] of fields) {
      if (current[rowName] === next[rowName]) continue;
      changedFields.push(publicName);
      previous[publicName] = current[rowName];
      nextValues[publicName] = next[rowName];
    }
    return { fields: changedFields, previous, next: nextValues };
  }

  private async recordEvent(
    runner: QueryRunner,
    schema: string,
    eventType: 'profile_updated' | 'mode_changed',
    changedFields: string[],
    previousValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    actorId: string,
  ): Promise<void> {
    await runner.query(
      `INSERT INTO ${quoteIdentifier(schema)}.invoice_settings_events(
         event_type, changed_fields, previous_values, new_values, actor_user_id
       ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
      [
        eventType,
        changedFields,
        JSON.stringify(previousValues),
        JSON.stringify(newValues),
        actorId,
      ],
    );
  }
}
