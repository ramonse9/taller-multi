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
  CreateSupplierDto,
  PaginatedSuppliersResponseDto,
  SupplierQueryDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';

interface SupplierRow {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  is_system: boolean;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

const SUPPLIER_COLUMNS = `id, name, legal_name, tax_id, phone, email, notes,
  is_active, is_system, created_by_user_id, updated_by_user_id, created_at, updated_at`;

@Injectable()
export class SuppliersService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(user: AuthenticatedUser, query: SupplierQueryDto): Promise<PaginatedSuppliersResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const search = `%${this.escapeLike(query.search.trim())}%`;
      const where = `supplier.is_active = $1 AND (
        $2 = '%%' OR supplier.name ILIKE $2 ESCAPE '\\'
        OR COALESCE(supplier.legal_name, '') ILIKE $2 ESCAPE '\\'
        OR COALESCE(supplier.tax_id, '') ILIKE $2 ESCAPE '\\'
        OR COALESCE(supplier.phone, '') ILIKE $2 ESCAPE '\\'
        OR COALESCE(supplier.email, '') ILIKE $2 ESCAPE '\\'
      )`;
      const parameters = [query.isActive, search];
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total FROM ${schema}.suppliers supplier WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `SELECT ${SUPPLIER_COLUMNS} FROM ${schema}.suppliers supplier
         WHERE ${where}
         ORDER BY supplier.is_system DESC, supplier.name, supplier.id
         LIMIT $3 OFFSET $4`,
        [...parameters, query.limit, offset],
      )) as SupplierRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toResponse(row)),
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<SupplierResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const row = await this.findOne(runner, schemaName, id);
      if (!row) throw new NotFoundException('Proveedor no encontrado');
      return this.toResponse(row);
    });
  }

  create(user: AuthenticatedUser, input: CreateSupplierDto): Promise<SupplierResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      try {
        const rows = (await runner.query(
          `INSERT INTO ${schema}.suppliers(
             name, legal_name, tax_id, phone, email, notes,
             created_by_user_id, updated_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
           RETURNING ${SUPPLIER_COLUMNS}`,
          [
            input.commercialName,
            input.legalName ?? null,
            input.taxId ?? null,
            input.phone ?? null,
            input.email ?? null,
            input.notes ?? null,
            user.id,
          ],
        )) as SupplierRow[];
        return this.toResponse(rows[0]!);
      } catch (error: unknown) {
        this.rethrowDuplicate(error);
      }
    });
  }

  update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const current = await this.findOne(runner, schemaName, id);
      if (!current) throw new NotFoundException('Proveedor no encontrado');
      if (current.is_system) {
        if (input.isActive === false) {
          throw new BadRequestException('El Proveedor general no puede desactivarse');
        }
        if (input.commercialName !== undefined && input.commercialName !== current.name) {
          throw new BadRequestException('El Proveedor general no puede cambiar de nombre');
        }
      }
      const schema = quoteIdentifier(schemaName);
      try {
        const result = (await runner.query(
          `UPDATE ${schema}.suppliers SET
             name = $2, legal_name = $3, tax_id = $4, phone = $5,
             email = $6, notes = $7, is_active = $8,
             updated_by_user_id = $9, updated_at = now()
           WHERE id = $1 RETURNING ${SUPPLIER_COLUMNS}`,
          [
            id,
            input.commercialName ?? current.name,
            input.legalName === undefined ? current.legal_name : input.legalName,
            input.taxId === undefined ? current.tax_id : input.taxId,
            input.phone === undefined ? current.phone : input.phone,
            input.email === undefined ? current.email : input.email,
            input.notes === undefined ? current.notes : input.notes,
            input.isActive ?? current.is_active,
            user.id,
          ],
        )) as [SupplierRow[], number];
        return this.toResponse(result[0][0]!);
      } catch (error: unknown) {
        this.rethrowDuplicate(error);
      }
    });
  }

  private async findOne(
    runner: QueryRunner,
    schemaName: string,
    id: string,
  ): Promise<SupplierRow | undefined> {
    const rows = (await runner.query(
      `SELECT ${SUPPLIER_COLUMNS} FROM ${quoteIdentifier(schemaName)}.suppliers WHERE id = $1`,
      [id],
    )) as SupplierRow[];
    return rows[0];
  }

  private toResponse(row: SupplierRow): SupplierResponseDto {
    return {
      id: row.id,
      commercialName: row.name,
      legalName: row.legal_name,
      taxId: row.tax_id,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      isActive: row.is_active,
      isDefault: row.is_system,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }

  private rethrowDuplicate(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as { code?: string; constraint?: string };
      if (driverError.code === '23505') {
        if (driverError.constraint === 'suppliers_tax_id_unique') {
          throw new ConflictException('Ya existe un proveedor con ese RFC');
        }
        throw new ConflictException('Ya existe un proveedor con ese nombre comercial');
      }
    }
    throw error;
  }
}
