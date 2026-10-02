import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryFailedError, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  ConceptKind,
  ConceptQueryDto,
  ConceptResponseDto,
  CreateConceptDto,
  CreateMeasurementUnitDto,
  MeasurementUnitQueryDto,
  MeasurementUnitResponseDto,
  PaginatedConceptsResponseDto,
  UpdateConceptDto,
  UpdateMeasurementUnitDto,
} from './dto/concept-catalog.dto';

interface UnitRow {
  id: string;
  name: string;
  symbol: string;
  sat_code: string | null;
  allows_decimals: boolean;
  is_active: boolean;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ConceptRow {
  id: string;
  kind: ConceptKind;
  sku: string | null;
  name: string;
  description: string | null;
  unit_price: string;
  cost: string;
  last_cost: string | null;
  average_cost: string | null;
  tracks_inventory: boolean;
  stock: string;
  minimum_stock: string;
  sat_product_service_code: string | null;
  is_active: boolean;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  unit_id: string;
  unit_name: string;
  unit_symbol: string;
  unit_sat_code: string | null;
  unit_allows_decimals: boolean;
  unit_is_active: boolean;
  unit_created_by_user_id: string | null;
  unit_updated_by_user_id: string | null;
  unit_created_at: Date;
  unit_updated_at: Date;
}

const UNIT_COLUMNS = `id, name, symbol, sat_code, allows_decimals, is_active,
  created_by_user_id, updated_by_user_id, created_at, updated_at`;

@Injectable()
export class ConceptCatalogService {
  constructor(private readonly tenant: TenantSessionService) {}

  listUnits(
    user: AuthenticatedUser,
    query: MeasurementUnitQueryDto,
  ): Promise<MeasurementUnitResponseDto[]> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const rows = (await runner.query(
        `SELECT ${UNIT_COLUMNS}
         FROM ${quoteIdentifier(schemaName)}.measurement_units
         WHERE is_active = $1 ORDER BY name, id`,
        [query.isActive],
      )) as UnitRow[];
      return rows.map((row) => this.toUnit(row));
    });
  }

  getUnit(user: AuthenticatedUser, id: string): Promise<MeasurementUnitResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const row = await this.findUnit(runner, schemaName, id);
      if (!row) throw new NotFoundException('Unidad no encontrada');
      return this.toUnit(row);
    });
  }

  createUnit(
    user: AuthenticatedUser,
    input: CreateMeasurementUnitDto,
  ): Promise<MeasurementUnitResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      try {
        const rows = (await runner.query(
          `INSERT INTO ${quoteIdentifier(schemaName)}.measurement_units(
             name, symbol, sat_code, allows_decimals, created_by_user_id, updated_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $5) RETURNING ${UNIT_COLUMNS}`,
          [input.name, input.symbol, input.satCode ?? null, input.allowsDecimals, user.id],
        )) as UnitRow[];
        return this.toUnit(rows[0]!);
      } catch (error: unknown) {
        this.rethrowConstraint(error, 'Ya existe una unidad con ese nombre o símbolo');
      }
    });
  }

  updateUnit(
    user: AuthenticatedUser,
    id: string,
    input: UpdateMeasurementUnitDto,
  ): Promise<MeasurementUnitResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const current = await this.findUnit(runner, schemaName, id);
      if (!current) throw new NotFoundException('Unidad no encontrada');
      try {
        const result = (await runner.query(
          `UPDATE ${quoteIdentifier(schemaName)}.measurement_units SET
             name = $2, symbol = $3, sat_code = $4, allows_decimals = $5,
             is_active = $6, updated_by_user_id = $7, updated_at = now()
           WHERE id = $1 RETURNING ${UNIT_COLUMNS}`,
          [
            id,
            input.name ?? current.name,
            input.symbol ?? current.symbol,
            input.satCode === undefined ? current.sat_code : input.satCode,
            input.allowsDecimals ?? current.allows_decimals,
            input.isActive ?? current.is_active,
            user.id,
          ],
        )) as [UnitRow[], number];
        return this.toUnit(result[0][0]!);
      } catch (error: unknown) {
        this.rethrowConstraint(error, 'Ya existe una unidad con ese nombre o símbolo');
      }
    });
  }

  listConcepts(
    user: AuthenticatedUser,
    query: ConceptQueryDto,
  ): Promise<PaginatedConceptsResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const search = `%${this.escapeLike(query.search.trim())}%`;
      const parameters = [query.isActive, query.kind ?? null, search];
      const where = `concept.is_active = $1
        AND ($2::varchar IS NULL OR concept.kind = $2)
        AND ($3 = '%%' OR concept.name ILIKE $3 ESCAPE '\\'
          OR COALESCE(concept.sku, '') ILIKE $3 ESCAPE '\\'
          OR COALESCE(concept.description, '') ILIKE $3 ESCAPE '\\'
          OR COALESCE(concept.sat_product_service_code, '') ILIKE $3 ESCAPE '\\')`;
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total FROM ${schema}.products_services concept WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `${this.conceptSelect(schema)} WHERE ${where}
         ORDER BY concept.name, concept.id LIMIT $4 OFFSET $5`,
        [...parameters, query.limit, offset],
      )) as ConceptRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toConcept(row)),
      };
    });
  }

  getConcept(user: AuthenticatedUser, id: string): Promise<ConceptResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const row = await this.findConcept(runner, schemaName, id);
      if (!row) throw new NotFoundException('Concepto no encontrado');
      return this.toConcept(row);
    });
  }

  createConcept(user: AuthenticatedUser, input: CreateConceptDto): Promise<ConceptResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      await this.requireActiveUnit(runner, schemaName, input.unitId);
      this.assertInventorySettings(input.kind, input.tracksInventory, input.minimumStock ?? 0, 0);
      const schema = quoteIdentifier(schemaName);
      try {
        const rows = (await runner.query(
          `INSERT INTO ${schema}.products_services(
             kind, sku, name, description, unit_id, cost, unit_price,
             tracks_inventory, minimum_stock, sat_product_service_code,
             created_by_user_id, updated_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
           RETURNING id`,
          [
            input.kind,
            input.sku ?? null,
            input.name,
            input.description ?? null,
            input.unitId,
            input.cost,
            input.price,
            input.tracksInventory,
            input.minimumStock ?? 0,
            input.satProductServiceCode ?? null,
            user.id,
          ],
        )) as Array<{ id: string }>;
        return this.toConcept((await this.findConcept(runner, schemaName, rows[0]!.id))!);
      } catch (error: unknown) {
        this.rethrowConstraint(error, 'El SKU ya está registrado');
      }
    });
  }

  updateConcept(
    user: AuthenticatedUser,
    id: string,
    input: UpdateConceptDto,
  ): Promise<ConceptResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const current = await this.findConcept(runner, schemaName, id);
      if (!current) throw new NotFoundException('Concepto no encontrado');
      const unitId = input.unitId ?? current.unit_id;
      if (input.unitId !== undefined) await this.requireActiveUnit(runner, schemaName, unitId);
      const kind = input.kind ?? current.kind;
      const tracksInventory = input.tracksInventory ?? current.tracks_inventory;
      const minimumStock = input.minimumStock ?? Number(current.minimum_stock);
      this.assertInventorySettings(kind, tracksInventory, minimumStock, Number(current.stock));
      try {
        await runner.query(
          `UPDATE ${quoteIdentifier(schemaName)}.products_services SET
             kind = $2, sku = $3, name = $4, description = $5, unit_id = $6,
             cost = $7, unit_price = $8, tracks_inventory = $9, minimum_stock = $10,
             sat_product_service_code = $11, is_active = $12,
             updated_by_user_id = $13, updated_at = now()
           WHERE id = $1`,
          [
            id,
            kind,
            input.sku === undefined ? current.sku : input.sku,
            input.name ?? current.name,
            input.description === undefined ? current.description : input.description,
            unitId,
            input.cost ?? Number(current.cost),
            input.price ?? Number(current.unit_price),
            tracksInventory,
            minimumStock,
            input.satProductServiceCode === undefined
              ? current.sat_product_service_code
              : input.satProductServiceCode,
            input.isActive ?? current.is_active,
            user.id,
          ],
        );
        return this.toConcept((await this.findConcept(runner, schemaName, id))!);
      } catch (error: unknown) {
        this.rethrowConstraint(error, 'El SKU ya está registrado');
      }
    });
  }

  private async findUnit(
    runner: QueryRunner,
    schemaName: string,
    id: string,
  ): Promise<UnitRow | undefined> {
    const rows = (await runner.query(
      `SELECT ${UNIT_COLUMNS} FROM ${quoteIdentifier(schemaName)}.measurement_units WHERE id = $1`,
      [id],
    )) as UnitRow[];
    return rows[0];
  }

  private async requireActiveUnit(
    runner: QueryRunner,
    schemaName: string,
    id: string,
  ): Promise<void> {
    const unit = await this.findUnit(runner, schemaName, id);
    if (!unit) throw new NotFoundException('Unidad no encontrada');
    if (!unit.is_active) throw new UnprocessableEntityException('La unidad está desactivada');
  }

  private async findConcept(
    runner: QueryRunner,
    schemaName: string,
    id: string,
  ): Promise<ConceptRow | undefined> {
    const schema = quoteIdentifier(schemaName);
    const rows = (await runner.query(`${this.conceptSelect(schema)} WHERE concept.id = $1`, [
      id,
    ])) as ConceptRow[];
    return rows[0];
  }

  private conceptSelect(schema: string): string {
    return `SELECT concept.id, concept.kind, concept.sku, concept.name, concept.description,
      concept.unit_price, concept.cost, concept.tracks_inventory,
      concept.stock, concept.minimum_stock,
      COALESCE(
        (SELECT lot.unit_cost::text FROM ${schema}.inventory_lots lot
         WHERE lot.product_id = concept.id
           AND NOT EXISTS (
             SELECT 1 FROM ${schema}.purchase_items purchase_item
             JOIN ${schema}.purchases purchase ON purchase.id = purchase_item.purchase_id
             WHERE purchase_item.id = lot.purchase_item_id AND purchase.status = 'cancelled'
           )
         ORDER BY lot.received_at DESC, lot.id DESC LIMIT 1),
        (SELECT item.unit_cost::text FROM ${schema}.purchase_items item
         JOIN ${schema}.purchases purchase ON purchase.id = item.purchase_id
         WHERE item.product_id = concept.id AND purchase.status = 'confirmed'
         ORDER BY purchase.confirmed_at DESC, item.id DESC LIMIT 1),
        concept.cost::text
      ) AS last_cost,
      (SELECT round(sum(lot.remaining_quantity * lot.unit_cost) /
        nullif(sum(lot.remaining_quantity), 0), 2)::text
       FROM ${schema}.inventory_lots lot
       WHERE lot.product_id = concept.id AND lot.remaining_quantity > 0) AS average_cost,
      concept.sat_product_service_code, concept.is_active,
      concept.created_by_user_id, concept.updated_by_user_id,
      concept.created_at, concept.updated_at,
      unit.id AS unit_id, unit.name AS unit_name, unit.symbol AS unit_symbol,
      unit.sat_code AS unit_sat_code, unit.allows_decimals AS unit_allows_decimals,
      unit.is_active AS unit_is_active,
      unit.created_by_user_id AS unit_created_by_user_id,
      unit.updated_by_user_id AS unit_updated_by_user_id,
      unit.created_at AS unit_created_at, unit.updated_at AS unit_updated_at
      FROM ${schema}.products_services concept
      JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id`;
  }

  private assertInventorySettings(
    kind: ConceptKind,
    tracksInventory: boolean,
    minimumStock: number,
    stock: number,
  ): void {
    if (kind === ConceptKind.Service && tracksInventory) {
      throw new BadRequestException('Un servicio no puede controlar inventario');
    }
    if (!tracksInventory && minimumStock !== 0) {
      throw new BadRequestException(
        'La existencia mínima solo aplica a productos con control de inventario',
      );
    }
    if (!tracksInventory && stock !== 0) {
      throw new UnprocessableEntityException(
        'No se puede desactivar el inventario mientras el producto tenga existencias',
      );
    }
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }

  private rethrowConstraint(error: unknown, duplicateMessage: string): never {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (code === '23505') throw new ConflictException(duplicateMessage);
      if (code === '23503') throw new BadRequestException('Una referencia asociada no existe');
      if (code === '23514')
        throw new BadRequestException('Los datos no cumplen las reglas del catálogo');
    }
    throw error;
  }

  private toUnit(row: UnitRow): MeasurementUnitResponseDto {
    return {
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      satCode: row.sat_code,
      allowsDecimals: row.allows_decimals,
      isActive: row.is_active,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toConcept(row: ConceptRow): ConceptResponseDto {
    return {
      id: row.id,
      kind: row.kind,
      sku: row.sku,
      name: row.name,
      description: row.description,
      unit: this.toUnit({
        id: row.unit_id,
        name: row.unit_name,
        symbol: row.unit_symbol,
        sat_code: row.unit_sat_code,
        allows_decimals: row.unit_allows_decimals,
        is_active: row.unit_is_active,
        created_by_user_id: row.unit_created_by_user_id,
        updated_by_user_id: row.unit_updated_by_user_id,
        created_at: row.unit_created_at,
        updated_at: row.unit_updated_at,
      }),
      cost: row.cost,
      lastCost: row.last_cost,
      averageCost: row.average_cost,
      price: row.unit_price,
      tracksInventory: row.tracks_inventory,
      stock: row.stock,
      minimumStock: row.minimum_stock,
      isLowStock:
        row.tracks_inventory &&
        Number(row.minimum_stock) > 0 &&
        Number(row.stock) <= Number(row.minimum_stock),
      satProductServiceCode: row.sat_product_service_code,
      isActive: row.is_active,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
