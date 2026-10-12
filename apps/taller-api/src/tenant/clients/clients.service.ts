import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  CfdiUseQueryDto,
  CfdiUseResponseDto,
  ClientQueryDto,
  ClientListItemResponseDto,
  ClientResponseDto,
  ClientsTotalResponseDto,
  CreateClientDto,
  CustomerType,
  FiscalReadinessIssueCode,
  FiscalReadinessMissingCode,
  FiscalReadinessResponseDto,
  FiscalRegimeResponseDto,
  PaginatedClientsResponseDto,
  UpdateClientDto,
} from './dto/client.dto';
import {
  COMPANY_RFC_PATTERN,
  GENERIC_RFCS,
  PERSON_RFC_PATTERN,
  RFC_PATTERN,
} from './rfc-validation';

interface ClientRow {
  id: string;
  customer_type: CustomerType;
  display_name: string;
  legal_name: string | null;
  contact_name: string | null;
  tax_id: string | null;
  fiscal_name: string | null;
  fiscal_postal_code: string | null;
  fiscal_regime_code: string | null;
  preferred_cfdi_use_code: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  fiscal_regime_exists?: boolean;
  fiscal_regime_active?: boolean;
  fiscal_regime_supports_customer_type?: boolean;
  cfdi_use_exists?: boolean;
  cfdi_use_active?: boolean;
  cfdi_use_current?: boolean;
  cfdi_use_supports_customer_type?: boolean;
  cfdi_use_supports_regime?: boolean;
}

interface ClientListRow extends ClientRow {
  vehicle_count: number;
  order_count: number;
}

const CLIENT_COLUMNS = `id, customer_type, display_name, legal_name, contact_name,
  tax_id, fiscal_name, fiscal_postal_code, fiscal_regime_code, preferred_cfdi_use_code,
  email, phone, notes,
  is_active, created_by_user_id, updated_by_user_id, created_at, updated_at`;

const CLIENT_SELECT_COLUMNS = `customer.id, customer.customer_type, customer.display_name,
  customer.legal_name, customer.contact_name, customer.tax_id, customer.fiscal_name,
  customer.fiscal_postal_code, customer.fiscal_regime_code,
  customer.preferred_cfdi_use_code, customer.email, customer.phone, customer.notes,
  customer.is_active, customer.created_by_user_id, customer.updated_by_user_id,
  customer.created_at, customer.updated_at`;

const FISCAL_READINESS_COLUMNS = `
  fiscal_regime.code IS NOT NULL AS fiscal_regime_exists,
  COALESCE(fiscal_regime.is_active, false) AS fiscal_regime_active,
  COALESCE(
    CASE customer.customer_type
      WHEN 'person' THEN fiscal_regime.supports_person
      WHEN 'company' THEN fiscal_regime.supports_company
      ELSE false
    END,
    false
  ) AS fiscal_regime_supports_customer_type,
  cfdi_use.code IS NOT NULL AS cfdi_use_exists,
  COALESCE(cfdi_use.is_active, false) AS cfdi_use_active,
  COALESCE(
    cfdi_use.valid_from <= CURRENT_DATE
      AND (cfdi_use.valid_to IS NULL OR cfdi_use.valid_to >= CURRENT_DATE),
    false
  ) AS cfdi_use_current,
  COALESCE(
    CASE customer.customer_type
      WHEN 'person' THEN cfdi_use.supports_person
      WHEN 'company' THEN cfdi_use.supports_company
      ELSE false
    END,
    false
  ) AS cfdi_use_supports_customer_type,
  EXISTS (
    SELECT 1
    FROM public.sat_cfdi_use_fiscal_regimes fiscal_compatibility
    WHERE fiscal_compatibility.cfdi_use_code = customer.preferred_cfdi_use_code
      AND fiscal_compatibility.fiscal_regime_code = customer.fiscal_regime_code
  ) AS cfdi_use_supports_regime`;

const FISCAL_CATALOG_JOINS = `
  LEFT JOIN public.sat_fiscal_regimes fiscal_regime
    ON fiscal_regime.code = customer.fiscal_regime_code
  LEFT JOIN public.sat_cfdi_uses cfdi_use
    ON cfdi_use.code = customer.preferred_cfdi_use_code`;

@Injectable()
export class ClientsService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(user: AuthenticatedUser, query: ClientQueryDto): Promise<PaginatedClientsResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const table = `${quoteIdentifier(schema)}.customers`;
      const search = query.search.trim();
      const where = search
        ? `customer.is_active = $1 AND (
            customer.display_name ILIKE $2 ESCAPE '\\' OR
            customer.legal_name ILIKE $2 ESCAPE '\\' OR
            customer.fiscal_name ILIKE $2 ESCAPE '\\' OR
            customer.contact_name ILIKE $2 ESCAPE '\\' OR
            customer.tax_id ILIKE $2 ESCAPE '\\' OR
            customer.email ILIKE $2 ESCAPE '\\' OR
            customer.phone ILIKE $2 ESCAPE '\\'
          )`
        : 'customer.is_active = $1';
      const parameters: unknown[] = search
        ? [query.isActive, `%${this.escapeLike(search)}%`]
        : [query.isActive];
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total FROM ${table} customer WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `SELECT ${CLIENT_SELECT_COLUMNS}, ${FISCAL_READINESS_COLUMNS},
                (SELECT count(*)::int
                 FROM ${quoteIdentifier(schema)}.vehicles vehicle
                 WHERE vehicle.customer_id = customer.id) AS vehicle_count,
                (SELECT count(*)::int
                 FROM ${quoteIdentifier(schema)}.orders service_order
                 WHERE service_order.customer_id = customer.id) AS order_count
         FROM ${table} customer
         ${FISCAL_CATALOG_JOINS}
         WHERE ${where}
         ORDER BY customer.created_at DESC, customer.id DESC
         LIMIT $${parameters.length + 1} OFFSET $${parameters.length + 2}`,
        [...parameters, query.limit, offset],
      )) as ClientListRow[];
      const totalPages = Math.ceil(totalItems / query.limit);
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        items: rows.map((row) => this.toListResponse(row)),
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<ClientResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const row = await this.findOne(runner, schema, id);
      if (!row) throw new NotFoundException('Cliente no encontrado');
      return this.toResponse(row);
    });
  }

  total(user: AuthenticatedUser): Promise<ClientsTotalResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const rows = (await runner.query(
        `SELECT count(*)::int AS total FROM ${quoteIdentifier(schema)}.customers WHERE is_active = true`,
      )) as Array<{ total: number }>;
      return { total: rows[0]?.total ?? 0 };
    });
  }

  listFiscalRegimes(
    user: AuthenticatedUser,
    customerType?: CustomerType,
  ): Promise<FiscalRegimeResponseDto[]> {
    return this.tenant.run(user, async (runner) => {
      const compatibilityColumn =
        customerType === CustomerType.Person
          ? 'supports_person'
          : customerType === CustomerType.Company
            ? 'supports_company'
            : null;
      const rows = (await runner.query(
        `SELECT code, name, supports_person, supports_company
         FROM public.sat_fiscal_regimes
         WHERE is_active = true${compatibilityColumn ? ` AND ${compatibilityColumn} = true` : ''}
         ORDER BY code`,
      )) as Array<{
        code: string;
        name: string;
        supports_person: boolean;
        supports_company: boolean;
      }>;
      return rows.map((row) => ({
        code: row.code,
        name: row.name,
        supportsPerson: row.supports_person,
        supportsCompany: row.supports_company,
      }));
    });
  }

  listCfdiUses(user: AuthenticatedUser, query: CfdiUseQueryDto): Promise<CfdiUseResponseDto[]> {
    return this.tenant.run(user, async (runner) => {
      const fiscalRegimeCode = this.normalizeUppercaseCode(query.fiscalRegimeCode);
      await this.assertFiscalRegimeCompatibility(runner, query.customerType, fiscalRegimeCode);

      const compatibilityColumn =
        query.customerType === CustomerType.Person
          ? 'cfdi_use.supports_person'
          : query.customerType === CustomerType.Company
            ? 'cfdi_use.supports_company'
            : null;
      const parameters: unknown[] = [];
      const conditions = [
        'cfdi_use.is_active = true',
        'cfdi_use.valid_from <= CURRENT_DATE',
        '(cfdi_use.valid_to IS NULL OR cfdi_use.valid_to >= CURRENT_DATE)',
      ];
      if (compatibilityColumn) conditions.push(`${compatibilityColumn} = true`);
      if (fiscalRegimeCode) {
        parameters.push(fiscalRegimeCode);
        conditions.push(`EXISTS (
          SELECT 1 FROM public.sat_cfdi_use_fiscal_regimes compatibility
          WHERE compatibility.cfdi_use_code = cfdi_use.code
            AND compatibility.fiscal_regime_code = $${parameters.length}
        )`);
      }

      const rows = (await runner.query(
        `SELECT cfdi_use.code, cfdi_use.description,
                cfdi_use.supports_person, cfdi_use.supports_company,
                cfdi_use.valid_from::text, cfdi_use.valid_to::text, cfdi_use.is_active
         FROM public.sat_cfdi_uses cfdi_use
         WHERE ${conditions.join(' AND ')}
         ORDER BY cfdi_use.code`,
        parameters,
      )) as Array<{
        code: string;
        description: string;
        supports_person: boolean;
        supports_company: boolean;
        valid_from: string;
        valid_to: string | null;
        is_active: boolean;
      }>;
      return rows.map((row) => ({
        code: row.code,
        description: row.description,
        supportsPerson: row.supports_person,
        supportsCompany: row.supports_company,
        validFrom: row.valid_from,
        validTo: row.valid_to,
        isActive: row.is_active,
      }));
    });
  }

  create(user: AuthenticatedUser, input: CreateClientDto): Promise<ClientResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const taxId = this.normalizeTaxId(input.taxId);
      const fiscalRegimeCode = this.normalizeUppercaseCode(input.fiscalRegimeCode);
      const preferredCfdiUseCode = this.normalizeUppercaseCode(input.preferredCfdiUseCode);
      this.assertTaxIdCompatibility(input.type, taxId);
      await this.assertFiscalRegimeCompatibility(runner, input.type, fiscalRegimeCode);
      await this.assertCfdiUseCompatibility(
        runner,
        input.type,
        fiscalRegimeCode,
        preferredCfdiUseCode,
      );
      try {
        const rows = (await runner.query(
          `INSERT INTO ${quoteIdentifier(schema)}.customers
            (customer_type, display_name, legal_name, contact_name,
             tax_id, fiscal_name, fiscal_postal_code, fiscal_regime_code, preferred_cfdi_use_code,
             email, phone, notes,
             created_by_user_id, updated_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
           RETURNING ${CLIENT_COLUMNS}`,
          [
            input.type,
            input.displayName,
            input.type === CustomerType.Company ? (input.legalName ?? null) : null,
            input.type === CustomerType.Company ? (input.contactName ?? null) : null,
            taxId,
            this.normalizeFiscalName(input.fiscalName),
            this.normalizePostalCode(input.fiscalPostalCode),
            fiscalRegimeCode,
            preferredCfdiUseCode,
            input.email ?? null,
            input.phone ?? null,
            input.notes ?? null,
            user.id,
          ],
        )) as ClientRow[];
        return this.toResponse(rows[0]!);
      } catch (error: unknown) {
        this.rethrowConstraint(error);
      }
    });
  }

  update(user: AuthenticatedUser, id: string, input: UpdateClientDto): Promise<ClientResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const current = await this.findOne(runner, schema, id);
      if (!current) throw new NotFoundException('Cliente no encontrado');
      const customerType = input.type ?? current.customer_type;
      const taxId = input.taxId === undefined ? current.tax_id : this.normalizeTaxId(input.taxId);
      const fiscalRegimeCode =
        input.fiscalRegimeCode === undefined
          ? current.fiscal_regime_code
          : this.normalizeUppercaseCode(input.fiscalRegimeCode);
      const preferredCfdiUseCode =
        input.preferredCfdiUseCode === undefined
          ? current.preferred_cfdi_use_code
          : this.normalizeUppercaseCode(input.preferredCfdiUseCode);
      const typeChanged = input.type !== undefined && input.type !== current.customer_type;
      const taxIdChanged = input.taxId !== undefined && taxId !== current.tax_id;
      const fiscalRegimeChanged =
        input.fiscalRegimeCode !== undefined && fiscalRegimeCode !== current.fiscal_regime_code;
      const cfdiUseChanged =
        input.preferredCfdiUseCode !== undefined &&
        preferredCfdiUseCode !== current.preferred_cfdi_use_code;
      if (typeChanged || taxIdChanged) {
        this.assertTaxIdCompatibility(customerType, taxId);
      }
      if (typeChanged || fiscalRegimeChanged) {
        await this.assertFiscalRegimeCompatibility(runner, customerType, fiscalRegimeCode);
      }
      if (typeChanged || fiscalRegimeChanged || cfdiUseChanged) {
        await this.assertCfdiUseCompatibility(
          runner,
          customerType,
          fiscalRegimeCode,
          preferredCfdiUseCode,
        );
      }
      try {
        const result = (await runner.query(
          `UPDATE ${quoteIdentifier(schema)}.customers SET
             customer_type = $2, display_name = $3, legal_name = $4, contact_name = $5,
             tax_id = $6, fiscal_name = $7, fiscal_postal_code = $8,
             fiscal_regime_code = $9, preferred_cfdi_use_code = $10,
             email = $11, phone = $12, notes = $13, is_active = $14,
             updated_by_user_id = $15, updated_at = now()
           WHERE id = $1 RETURNING ${CLIENT_COLUMNS}`,
          [
            id,
            customerType,
            input.displayName ?? current.display_name,
            customerType === CustomerType.Company
              ? input.legalName === undefined
                ? current.legal_name
                : input.legalName
              : null,
            customerType === CustomerType.Company
              ? input.contactName === undefined
                ? current.contact_name
                : input.contactName
              : null,
            taxId,
            input.fiscalName === undefined
              ? current.fiscal_name
              : this.normalizeFiscalName(input.fiscalName),
            input.fiscalPostalCode === undefined
              ? current.fiscal_postal_code
              : this.normalizePostalCode(input.fiscalPostalCode),
            fiscalRegimeCode,
            preferredCfdiUseCode,
            input.email === undefined ? current.email : input.email,
            input.phone === undefined ? current.phone : input.phone,
            input.notes === undefined ? current.notes : input.notes,
            input.isActive ?? current.is_active,
            user.id,
          ],
        )) as [ClientRow[], number];
        const updated = result[0][0]!;
        const readinessRow =
          typeChanged || fiscalRegimeChanged || cfdiUseChanged
            ? updated
            : {
                ...updated,
                fiscal_regime_exists: current.fiscal_regime_exists,
                fiscal_regime_active: current.fiscal_regime_active,
                fiscal_regime_supports_customer_type:
                  current.fiscal_regime_supports_customer_type,
                cfdi_use_exists: current.cfdi_use_exists,
                cfdi_use_active: current.cfdi_use_active,
                cfdi_use_current: current.cfdi_use_current,
                cfdi_use_supports_customer_type: current.cfdi_use_supports_customer_type,
                cfdi_use_supports_regime: current.cfdi_use_supports_regime,
              };
        return this.toResponse(readinessRow);
      } catch (error: unknown) {
        this.rethrowConstraint(error);
      }
    });
  }

  private async findOne(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<ClientRow | undefined> {
    const rows = (await runner.query(
      `SELECT ${CLIENT_SELECT_COLUMNS}, ${FISCAL_READINESS_COLUMNS}
       FROM ${quoteIdentifier(schema)}.customers customer
       ${FISCAL_CATALOG_JOINS}
       WHERE customer.id = $1`,
      [id],
    )) as ClientRow[];
    return rows[0];
  }

  private normalizeTaxId(value: string | null | undefined): string | null {
    return value?.trim().toUpperCase() || null;
  }

  private assertTaxIdCompatibility(
    customerType: CustomerType,
    taxId: string | null | undefined,
  ): void {
    if (!taxId || GENERIC_RFCS.has(taxId)) return;
    if (!RFC_PATTERN.test(taxId)) {
      throw new BadRequestException('El RFC tiene una estructura inválida');
    }
    if (customerType === CustomerType.Person && COMPANY_RFC_PATTERN.test(taxId)) {
      throw new BadRequestException(
        'No se puede usar un RFC de persona moral para una persona física',
      );
    }
    if (customerType === CustomerType.Company && PERSON_RFC_PATTERN.test(taxId)) {
      throw new BadRequestException(
        'No se puede usar un RFC de persona física para una persona moral',
      );
    }
  }

  private normalizeFiscalName(value: string | null | undefined): string | null {
    return value?.trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX') || null;
  }

  private normalizePostalCode(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }

  private normalizeUppercaseCode(value: string | null | undefined): string | null {
    return value?.trim().toUpperCase() || null;
  }

  private async assertFiscalRegimeCompatibility(
    runner: QueryRunner,
    customerType: CustomerType | undefined,
    fiscalRegimeCode: string | null | undefined,
  ): Promise<void> {
    if (!fiscalRegimeCode) return;
    const rows = (await runner.query(
      `SELECT supports_person, supports_company
       FROM public.sat_fiscal_regimes
       WHERE code = $1 AND is_active = true`,
      [fiscalRegimeCode],
    )) as Array<{ supports_person: boolean; supports_company: boolean }>;
    const regime = rows[0];
    if (!regime) throw new BadRequestException('El régimen fiscal no existe o está inactivo');
    if (!customerType) return;
    const compatible =
      customerType === CustomerType.Person ? regime.supports_person : regime.supports_company;
    if (!compatible) {
      throw new BadRequestException(
        `El régimen fiscal no es compatible con una ${
          customerType === CustomerType.Person ? 'persona física' : 'persona moral'
        }`,
      );
    }
  }

  private async assertCfdiUseCompatibility(
    runner: QueryRunner,
    customerType: CustomerType,
    fiscalRegimeCode: string | null | undefined,
    cfdiUseCode: string | null | undefined,
  ): Promise<void> {
    if (!cfdiUseCode) return;
    if (!fiscalRegimeCode) {
      throw new BadRequestException(
        'Selecciona un régimen fiscal antes de guardar el Uso de CFDI preferido',
      );
    }

    const rows = (await runner.query(
      `SELECT cfdi_use.supports_person, cfdi_use.supports_company,
              cfdi_use.is_active,
              cfdi_use.valid_from <= CURRENT_DATE AND
                (cfdi_use.valid_to IS NULL OR cfdi_use.valid_to >= CURRENT_DATE) AS is_current,
              EXISTS (
                SELECT 1 FROM public.sat_cfdi_use_fiscal_regimes compatibility
                WHERE compatibility.cfdi_use_code = cfdi_use.code
                  AND compatibility.fiscal_regime_code = $2
              ) AS supports_regime
       FROM public.sat_cfdi_uses cfdi_use
       WHERE cfdi_use.code = $1`,
      [cfdiUseCode, fiscalRegimeCode],
    )) as Array<{
      supports_person: boolean;
      supports_company: boolean;
      is_active: boolean;
      is_current: boolean;
      supports_regime: boolean;
    }>;
    const use = rows[0];
    if (!use) throw new BadRequestException('El Uso de CFDI no existe en el catálogo del SAT');
    if (!use.is_active || !use.is_current) {
      throw new BadRequestException('El Uso de CFDI está inactivo o fuera de vigencia');
    }
    const supportsCustomerType =
      customerType === CustomerType.Person ? use.supports_person : use.supports_company;
    if (!supportsCustomerType) {
      throw new BadRequestException(
        `El Uso de CFDI no es compatible con una ${
          customerType === CustomerType.Person ? 'persona física' : 'persona moral'
        }`,
      );
    }
    if (!use.supports_regime) {
      throw new BadRequestException(
        'El Uso de CFDI no es compatible con el régimen fiscal seleccionado',
      );
    }
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }

  private rethrowConstraint(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === '23505') throw new ConflictException('Ya existe un cliente con esos datos');
      if (code === '23503') throw new BadRequestException('Una referencia asociada no existe');
    }
    throw error;
  }

  private toResponse(row: ClientRow): ClientResponseDto {
    return {
      id: row.id,
      type: row.customer_type,
      displayName: row.display_name,
      legalName: row.legal_name,
      contactName: row.contact_name,
      taxId: row.tax_id,
      fiscalName: row.fiscal_name,
      fiscalPostalCode: row.fiscal_postal_code,
      fiscalRegimeCode: row.fiscal_regime_code,
      preferredCfdiUseCode: row.preferred_cfdi_use_code,
      fiscalReadiness: this.calculateFiscalReadiness(row),
      email: row.email,
      phone: row.phone,
      notes: row.notes,
      isActive: row.is_active,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private calculateFiscalReadiness(row: ClientRow): FiscalReadinessResponseDto {
    const missingFields: FiscalReadinessResponseDto['missingFields'] = [];
    const validationIssues: FiscalReadinessResponseDto['validationIssues'] = [];
    const addMissing = (
      code: FiscalReadinessMissingCode,
      field: string,
      message: string,
    ): void => {
      missingFields.push({ code, field, message });
    };
    const addIssue = (
      code: FiscalReadinessIssueCode,
      field: string,
      message: string,
    ): void => {
      validationIssues.push({ code, field, message });
    };

    const taxId = this.normalizeTaxId(row.tax_id);
    if (!taxId) {
      addMissing(FiscalReadinessMissingCode.TaxIdRequired, 'taxId', 'Falta el RFC.');
    } else if (!RFC_PATTERN.test(taxId)) {
      addIssue(
        FiscalReadinessIssueCode.TaxIdInvalid,
        'taxId',
        'El RFC tiene una estructura inválida.',
      );
    } else if (!GENERIC_RFCS.has(taxId)) {
      const incompatible =
        (row.customer_type === CustomerType.Person && COMPANY_RFC_PATTERN.test(taxId)) ||
        (row.customer_type === CustomerType.Company && PERSON_RFC_PATTERN.test(taxId));
      if (incompatible) {
        addIssue(
          FiscalReadinessIssueCode.TaxIdIncompatible,
          'taxId',
          `El RFC no corresponde a una ${
            row.customer_type === CustomerType.Person ? 'persona física' : 'persona moral'
          }.`,
        );
      }
    }

    if (!row.fiscal_name?.trim()) {
      addMissing(
        FiscalReadinessMissingCode.FiscalNameRequired,
        'fiscalName',
        `Falta ${
          row.customer_type === CustomerType.Person
            ? 'el nombre fiscal'
            : 'la razón social fiscal'
        }.`,
      );
    }

    if (!row.fiscal_postal_code) {
      addMissing(
        FiscalReadinessMissingCode.FiscalPostalCodeRequired,
        'fiscalPostalCode',
        'Falta el código postal fiscal.',
      );
    } else if (!/^\d{5}$/.test(row.fiscal_postal_code)) {
      addIssue(
        FiscalReadinessIssueCode.FiscalPostalCodeInvalid,
        'fiscalPostalCode',
        'El código postal fiscal debe contener exactamente 5 dígitos.',
      );
    }

    if (!row.fiscal_regime_code) {
      addMissing(
        FiscalReadinessMissingCode.FiscalRegimeRequired,
        'fiscalRegimeCode',
        'Falta el régimen fiscal.',
      );
    } else if (row.fiscal_regime_exists === false) {
      addIssue(
        FiscalReadinessIssueCode.FiscalRegimeNotFound,
        'fiscalRegimeCode',
        'El régimen fiscal no existe en el catálogo.',
      );
    } else if (row.fiscal_regime_active === false) {
      addIssue(
        FiscalReadinessIssueCode.FiscalRegimeInactive,
        'fiscalRegimeCode',
        'El régimen fiscal está inactivo.',
      );
    } else if (row.fiscal_regime_supports_customer_type === false) {
      addIssue(
        FiscalReadinessIssueCode.FiscalRegimeIncompatible,
        'fiscalRegimeCode',
        `El régimen fiscal no es compatible con una ${
          row.customer_type === CustomerType.Person ? 'persona física' : 'persona moral'
        }.`,
      );
    }

    if (!row.preferred_cfdi_use_code) {
      addMissing(
        FiscalReadinessMissingCode.CfdiUseRequired,
        'preferredCfdiUseCode',
        'Falta el Uso de CFDI preferido.',
      );
    } else if (row.cfdi_use_exists === false) {
      addIssue(
        FiscalReadinessIssueCode.CfdiUseNotFound,
        'preferredCfdiUseCode',
        'El Uso de CFDI no existe en el catálogo.',
      );
    } else {
      if (row.cfdi_use_active === false) {
        addIssue(
          FiscalReadinessIssueCode.CfdiUseInactive,
          'preferredCfdiUseCode',
          'El Uso de CFDI está inactivo.',
        );
      }
      if (row.cfdi_use_current === false) {
        addIssue(
          FiscalReadinessIssueCode.CfdiUseOutOfValidity,
          'preferredCfdiUseCode',
          'El Uso de CFDI está fuera de vigencia.',
        );
      }
      if (row.cfdi_use_supports_customer_type === false) {
        addIssue(
          FiscalReadinessIssueCode.CfdiUseIncompatibleWithCustomerType,
          'preferredCfdiUseCode',
          `El Uso de CFDI no es compatible con una ${
            row.customer_type === CustomerType.Person ? 'persona física' : 'persona moral'
          }.`,
        );
      }
      if (row.cfdi_use_supports_regime === false) {
        addIssue(
          FiscalReadinessIssueCode.CfdiUseIncompatibleWithFiscalRegime,
          'preferredCfdiUseCode',
          'El Uso de CFDI no es compatible con el régimen fiscal seleccionado.',
        );
      }
    }

    const profileFields = new Set([
      'taxId',
      'fiscalName',
      'fiscalPostalCode',
      'fiscalRegimeCode',
    ]);
    const isFiscalProfileComplete =
      !missingFields.some(({ field }) => profileFields.has(field)) &&
      !validationIssues.some(({ field }) => profileFields.has(field));
    const isReadyToInvoice =
      isFiscalProfileComplete &&
      !missingFields.some(({ field }) => field === 'preferredCfdiUseCode') &&
      !validationIssues.some(({ field }) => field === 'preferredCfdiUseCode');

    return {
      isFiscalProfileComplete,
      isReadyToInvoice,
      missingFields,
      validationIssues,
    };
  }

  private toListResponse(row: ClientListRow): ClientListItemResponseDto {
    return {
      ...this.toResponse(row),
      vehicleCount: row.vehicle_count,
      orderCount: row.order_count,
    };
  }
}
