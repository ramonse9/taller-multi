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
  ClientQueryDto,
  ClientListItemResponseDto,
  ClientResponseDto,
  ClientsTotalResponseDto,
  CreateClientDto,
  CustomerType,
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
  tax_id, email, phone, notes,
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

  create(user: AuthenticatedUser, input: CreateClientDto): Promise<ClientResponseDto> {
    return this.tenant.run(user, async (runner, schema) => {
      try {
        const rows = (await runner.query(
          `INSERT INTO ${quoteIdentifier(schema)}.customers
            (customer_type, display_name, legal_name, contact_name,
             tax_id, email, phone, notes,
             created_by_user_id, updated_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
           RETURNING ${CLIENT_COLUMNS}`,
          [
            input.type,
            input.displayName,
            input.type === CustomerType.Company ? (input.legalName ?? null) : null,
            input.type === CustomerType.Company ? (input.contactName ?? null) : null,
            this.normalizeTaxId(input.taxId),
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
      try {
        const result = (await runner.query(
          `UPDATE ${quoteIdentifier(schema)}.customers SET
             customer_type = $2, display_name = $3, legal_name = $4, contact_name = $5,
             tax_id = $6, email = $7, phone = $8, notes = $9, is_active = $10,
             updated_by_user_id = $11, updated_at = now()
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
