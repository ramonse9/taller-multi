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
  FiscalRegimeResponseDto,
  PaginatedClientsResponseDto,
  UpdateClientDto,
} from './dto/client.dto';

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
}

interface ClientListRow extends ClientRow {
  vehicle_count: number;
  order_count: number;
}

const CLIENT_COLUMNS = `id, customer_type, display_name, legal_name, contact_name,
  tax_id, fiscal_name, fiscal_postal_code, fiscal_regime_code, preferred_cfdi_use_code,
  email, phone, notes,
  is_active, created_by_user_id, updated_by_user_id, created_at, updated_at`;

@Injectable()
export class ClientsService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(user: AuthenticatedUser, query: ClientQueryDto): Promise<PaginatedClientsResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      const table = `${quoteIdentifier(schema)}.customers`;
      const search = query.search.trim();
      const where = search
        ? `is_active = $1 AND (
            display_name ILIKE $2 ESCAPE '\\' OR legal_name ILIKE $2 ESCAPE '\\' OR
            fiscal_name ILIKE $2 ESCAPE '\\' OR
            contact_name ILIKE $2 ESCAPE '\\' OR tax_id ILIKE $2 ESCAPE '\\' OR
            email ILIKE $2 ESCAPE '\\' OR phone ILIKE $2 ESCAPE '\\'
          )`
        : 'is_active = $1';
      const parameters: unknown[] = search
        ? [query.isActive, `%${this.escapeLike(search)}%`]
        : [query.isActive];
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total FROM ${table} WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `SELECT ${CLIENT_COLUMNS},
                (SELECT count(*)::int
                 FROM ${quoteIdentifier(schema)}.vehicles vehicle
                 WHERE vehicle.customer_id = customer.id) AS vehicle_count,
                (SELECT count(*)::int
                 FROM ${quoteIdentifier(schema)}.orders service_order
                 WHERE service_order.customer_id = customer.id) AS order_count
         FROM ${table} customer WHERE ${where}
         ORDER BY created_at DESC, id DESC
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
      const fiscalRegimeCode = this.normalizeUppercaseCode(input.fiscalRegimeCode);
      const preferredCfdiUseCode = this.normalizeUppercaseCode(input.preferredCfdiUseCode);
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
            this.normalizeTaxId(input.taxId),
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
      const fiscalRegimeCode =
        input.fiscalRegimeCode === undefined
          ? current.fiscal_regime_code
          : this.normalizeUppercaseCode(input.fiscalRegimeCode);
      const preferredCfdiUseCode =
        input.preferredCfdiUseCode === undefined
          ? current.preferred_cfdi_use_code
          : this.normalizeUppercaseCode(input.preferredCfdiUseCode);
      await this.assertFiscalRegimeCompatibility(runner, customerType, fiscalRegimeCode);
      await this.assertCfdiUseCompatibility(
        runner,
        customerType,
        fiscalRegimeCode,
        preferredCfdiUseCode,
      );
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
            input.taxId === undefined ? current.tax_id : this.normalizeTaxId(input.taxId),
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
        return this.toResponse(result[0][0]!);
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
      `SELECT ${CLIENT_COLUMNS} FROM ${quoteIdentifier(schema)}.customers WHERE id = $1`,
      [id],
    )) as ClientRow[];
    return rows[0];
  }

  private normalizeTaxId(value: string | null | undefined): string | null {
    return value?.trim().toUpperCase() || null;
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

  private toListResponse(row: ClientListRow): ClientListItemResponseDto {
    return {
      ...this.toResponse(row),
      vehicleCount: row.vehicle_count,
      orderCount: row.order_count,
    };
  }
}
