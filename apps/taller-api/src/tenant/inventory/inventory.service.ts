import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  CreateInventoryMovementDto,
  InventoryLotResponseDto,
  InventoryLotSourceType,
  InventoryMovementQueryDto,
  InventoryMovementResponseDto,
  InventoryMovementType,
  InventoryProductQueryDto,
  InventoryProductResponseDto,
  PaginatedInventoryMovementsResponseDto,
  PaginatedInventoryProductsResponseDto,
} from './dto/inventory.dto';

interface InventoryProductRow {
  id: string;
  sku: string | null;
  name: string;
  kind: 'product' | 'service';
  tracks_inventory: boolean;
  stock: string;
  minimum_stock: string;
  is_active: boolean;
  unit_id: string;
  unit_name: string;
  unit_symbol: string;
  allows_decimals: boolean;
  last_cost: string | null;
  average_cost: string | null;
}

interface InventoryLotRow {
  id: string;
  product_id: string;
  received_quantity: string;
  remaining_quantity: string;
  unit_cost: string;
  received_at: Date;
  source_type: InventoryLotSourceType;
  source_reference: string | null;
  entry_movement_id: string | null;
  created_by_user_id: string | null;
  created_by_name: string | null;
}

interface InventoryMovementRow {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  movement_type: InventoryMovementType;
  quantity: string;
  previous_stock: string;
  resulting_stock: string;
  unit_cost: string | null;
  reason: string;
  created_by_user_id: string;
  created_by_name: string;
  created_at: Date;
}

@Injectable()
export class InventoryService {
  constructor(private readonly tenant: TenantSessionService) {}

  listProducts(
    user: AuthenticatedUser,
    query: InventoryProductQueryDto,
  ): Promise<PaginatedInventoryProductsResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const search = `%${this.escapeLike(query.search.trim())}%`;
      const lowStock = query.lowStock ?? null;
      const parameters = [query.isActive, search, lowStock];
      const where = `concept.tracks_inventory = true AND concept.is_active = $1
        AND ($2 = '%%' OR concept.name ILIKE $2 ESCAPE '\\'
          OR COALESCE(concept.sku, '') ILIKE $2 ESCAPE '\\')
        AND ($3::boolean IS NULL OR
          (concept.minimum_stock > 0 AND concept.stock <= concept.minimum_stock) = $3)`;
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total
         FROM ${schema}.products_services concept WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `${this.productSelect(schema)} WHERE ${where}
         ORDER BY concept.name, concept.id LIMIT $4 OFFSET $5`,
        [...parameters, query.limit, offset],
      )) as InventoryProductRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toProduct(row)),
      };
    });
  }

  getProduct(user: AuthenticatedUser, id: string): Promise<InventoryProductResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const product = await this.findProduct(runner, schemaName, id);
      if (!product || !product.tracks_inventory) {
        throw new NotFoundException('Producto con inventario no encontrado');
      }
      return this.toProduct(product);
    });
  }

  listLots(user: AuthenticatedUser, id: string): Promise<InventoryLotResponseDto[]> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const product = await this.findProduct(runner, schemaName, id);
      if (!product || !product.tracks_inventory) {
        throw new NotFoundException('Producto con inventario no encontrado');
      }
      const schema = quoteIdentifier(schemaName);
      const rows = (await runner.query(
        `SELECT lot.id, lot.product_id, lot.received_quantity, lot.remaining_quantity,
          lot.unit_cost, lot.received_at, lot.source_type, lot.source_reference,
          lot.entry_movement_id, lot.created_by_user_id,
          platform_user.full_name AS created_by_name
         FROM ${schema}.inventory_lots lot
         LEFT JOIN public.users platform_user ON platform_user.id = lot.created_by_user_id
         WHERE lot.product_id = $1
         ORDER BY lot.received_at DESC, lot.id DESC`,
        [id],
      )) as InventoryLotRow[];
      return rows.map((row) => this.toLot(row));
    });
  }

  listMovements(
    user: AuthenticatedUser,
    query: InventoryMovementQueryDto,
  ): Promise<PaginatedInventoryMovementsResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const parameters = [query.productId ?? null, query.type ?? null];
      const where = `($1::uuid IS NULL OR movement.product_id = $1)
        AND ($2::varchar IS NULL OR movement.movement_type = $2)`;
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total
         FROM ${schema}.inventory_movements movement WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `${this.movementSelect(schema)} WHERE ${where}
         ORDER BY movement.created_at DESC, movement.id DESC LIMIT $3 OFFSET $4`,
        [...parameters, query.limit, offset],
      )) as InventoryMovementRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toMovement(row)),
      };
    });
  }

  createMovement(
    user: AuthenticatedUser,
    input: CreateInventoryMovementDto,
  ): Promise<InventoryMovementResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const product = await this.lockProduct(runner, schema, input.productId);
      if (!product) throw new NotFoundException('Producto no encontrado');
      if (product.kind === 'service') {
        throw new BadRequestException('Los servicios no pueden tener movimientos de inventario');
      }
      if (!product.tracks_inventory) {
        throw new BadRequestException('El producto no controla inventario');
      }
      if (!product.is_active)
        throw new UnprocessableEntityException('El producto está desactivado');
      if (!product.allows_decimals && !Number.isInteger(input.quantity)) {
        throw new BadRequestException('La unidad del producto no permite cantidades decimales');
      }
      if (input.type !== InventoryMovementType.Adjustment && input.quantity <= 0) {
        throw new BadRequestException('Las entradas y salidas requieren una cantidad positiva');
      }
      const delta = input.type === InventoryMovementType.Exit ? -input.quantity : input.quantity;
      const createsLot = delta > 0;
      if (createsLot && input.unitCost == null) {
        throw new BadRequestException('El costo unitario es obligatorio para aumentar existencias');
      }
      if (!createsLot && input.unitCost != null) {
        throw new BadRequestException('El costo unitario solo aplica al aumentar existencias');
      }
      const updated = (await runner.query(
        `UPDATE ${schema}.products_services
         SET stock = stock + $2,
             cost = CASE WHEN $4::numeric IS NULL THEN cost ELSE $4 END,
             updated_by_user_id = $3, updated_at = now()
         WHERE id = $1 AND stock + $2 >= 0
         RETURNING (stock - $2)::text AS previous_stock, stock::text AS resulting_stock`,
        [input.productId, delta, user.id, createsLot ? input.unitCost : null],
      )) as [Array<{ previous_stock: string; resulting_stock: string }>, number];
      const balance = updated[0][0];
      if (!balance) {
        throw new UnprocessableEntityException('La salida supera la existencia disponible');
      }
      const inserted = (await runner.query(
        `INSERT INTO ${schema}.inventory_movements(
           product_id, movement_type, quantity, previous_stock, resulting_stock,
           unit_cost, reason, created_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          input.productId,
          input.type,
          delta,
          balance.previous_stock,
          balance.resulting_stock,
          input.unitCost ?? null,
          input.reason,
          user.id,
        ],
      )) as Array<{ id: string }>;
      const movementId = inserted[0]!.id;
      if (createsLot) {
        const sourceType =
          input.type === InventoryMovementType.Entry
            ? InventoryLotSourceType.ManualEntry
            : InventoryLotSourceType.Adjustment;
        const lots = (await runner.query(
          `INSERT INTO ${schema}.inventory_lots(
             product_id, received_quantity, remaining_quantity, unit_cost,
             source_type, source_reference, created_by_user_id, entry_movement_id
           ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [input.productId, delta, input.unitCost, sourceType, input.reason, user.id, movementId],
        )) as Array<{ id: string }>;
        await runner.query(`UPDATE ${schema}.inventory_movements SET lot_id = $2 WHERE id = $1`, [
          movementId,
          lots[0]!.id,
        ]);
      } else {
        await this.consumeLots(runner, schema, input.productId, movementId, Math.abs(delta));
      }
      const movement = await this.findMovement(runner, schema, movementId);
      if (!movement) throw new Error('No se pudo registrar el movimiento');
      return this.toMovement(movement);
    });
  }

  private async findProduct(
    runner: QueryRunner,
    schemaName: string,
    id: string,
  ): Promise<InventoryProductRow | undefined> {
    const schema = quoteIdentifier(schemaName);
    const rows = (await runner.query(`${this.productSelect(schema)} WHERE concept.id = $1`, [
      id,
    ])) as InventoryProductRow[];
    return rows[0];
  }

  private async lockProduct(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<InventoryProductRow | undefined> {
    const rows = (await runner.query(
      `${this.productSelect(schema)} WHERE concept.id = $1 FOR UPDATE OF concept`,
      [id],
    )) as InventoryProductRow[];
    return rows[0];
  }

  private async findMovement(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<InventoryMovementRow | undefined> {
    const rows = (await runner.query(`${this.movementSelect(schema)} WHERE movement.id = $1`, [
      id,
    ])) as InventoryMovementRow[];
    return rows[0];
  }

  private async consumeLots(
    runner: QueryRunner,
    schema: string,
    productId: string,
    movementId: string,
    requiredQuantity: number,
  ): Promise<void> {
    const lots = (await runner.query(
      `SELECT id, remaining_quantity::text, unit_cost::text
       FROM ${schema}.inventory_lots
       WHERE product_id = $1 AND remaining_quantity > 0
       ORDER BY received_at, id
       FOR UPDATE`,
      [productId],
    )) as Array<{ id: string; remaining_quantity: string; unit_cost: string }>;
    let pending = requiredQuantity;
    for (const lot of lots) {
      if (pending <= 0) break;
      const consumed = Math.min(pending, Number(lot.remaining_quantity));
      await runner.query(
        `UPDATE ${schema}.inventory_lots
         SET remaining_quantity = remaining_quantity - $2
         WHERE id = $1`,
        [lot.id, consumed],
      );
      await runner.query(
        `INSERT INTO ${schema}.inventory_lot_allocations(
           movement_id, lot_id, quantity, unit_cost
         ) VALUES ($1, $2, $3, $4)`,
        [movementId, lot.id, consumed, lot.unit_cost],
      );
      pending = Number((pending - consumed).toFixed(3));
    }
    if (pending > 0) {
      throw new UnprocessableEntityException(
        'No existen lotes suficientes para respaldar la salida',
      );
    }
    await runner.query(
      `UPDATE ${schema}.inventory_movements movement
       SET unit_cost = allocation.average_cost
       FROM (
         SELECT round(sum(quantity * unit_cost) / nullif(sum(quantity), 0), 2) AS average_cost
         FROM ${schema}.inventory_lot_allocations WHERE movement_id = $1
       ) allocation
       WHERE movement.id = $1`,
      [movementId],
    );
  }

  private productSelect(schema: string): string {
    return `SELECT concept.id, concept.sku, concept.name, concept.kind,
      concept.tracks_inventory, concept.stock, concept.minimum_stock, concept.is_active,
      unit.id AS unit_id, unit.name AS unit_name, unit.symbol AS unit_symbol,
      unit.allows_decimals,
      (SELECT lot.unit_cost::text FROM ${schema}.inventory_lots lot
       WHERE lot.product_id = concept.id
       ORDER BY lot.received_at DESC, lot.id DESC LIMIT 1) AS last_cost,
      (SELECT round(sum(lot.remaining_quantity * lot.unit_cost) /
        nullif(sum(lot.remaining_quantity), 0), 2)::text
       FROM ${schema}.inventory_lots lot
       WHERE lot.product_id = concept.id AND lot.remaining_quantity > 0) AS average_cost
      FROM ${schema}.products_services concept
      JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id`;
  }

  private movementSelect(schema: string): string {
    return `SELECT movement.id, movement.product_id, concept.name AS product_name,
      concept.sku AS product_sku, movement.movement_type, movement.quantity,
      movement.previous_stock, movement.resulting_stock, movement.unit_cost,
      movement.reason, movement.created_by_user_id,
      platform_user.full_name AS created_by_name, movement.created_at
      FROM ${schema}.inventory_movements movement
      JOIN ${schema}.products_services concept ON concept.id = movement.product_id
      JOIN public.users platform_user ON platform_user.id = movement.created_by_user_id`;
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }

  private toProduct(row: InventoryProductRow): InventoryProductResponseDto {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      unitId: row.unit_id,
      unitName: row.unit_name,
      unitSymbol: row.unit_symbol,
      allowsDecimals: row.allows_decimals,
      stock: row.stock,
      minimumStock: row.minimum_stock,
      lastCost: row.last_cost,
      averageCost: row.average_cost,
      isLowStock: Number(row.minimum_stock) > 0 && Number(row.stock) <= Number(row.minimum_stock),
      isActive: row.is_active,
    };
  }

  private toMovement(row: InventoryMovementRow): InventoryMovementResponseDto {
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productSku: row.product_sku,
      type: row.movement_type,
      quantity: row.quantity,
      previousStock: row.previous_stock,
      resultingStock: row.resulting_stock,
      unitCost: row.unit_cost,
      reason: row.reason,
      createdByUserId: row.created_by_user_id,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
    };
  }

  private toLot(row: InventoryLotRow): InventoryLotResponseDto {
    return {
      id: row.id,
      productId: row.product_id,
      receivedQuantity: row.received_quantity,
      remainingQuantity: row.remaining_quantity,
      unitCost: row.unit_cost,
      receivedAt: row.received_at,
      sourceType: row.source_type,
      sourceReference: row.source_reference,
      entryMovementId: row.entry_movement_id,
      createdByUserId: row.created_by_user_id,
      createdByName: row.created_by_name,
    };
  }
}
