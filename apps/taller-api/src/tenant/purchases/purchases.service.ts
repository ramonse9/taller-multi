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
  ChangePurchaseStatusDto,
  CreatePurchaseDto,
  PaginatedPurchasesResponseDto,
  PurchaseItemInputDto,
  PurchaseItemResponseDto,
  PurchaseQueryDto,
  PurchaseResponseDto,
  PurchaseStatus,
  PurchaseStatusHistoryResponseDto,
  PurchaseSummaryResponseDto,
  UpdatePurchaseDto,
} from './dto/purchase.dto';

interface PurchaseRow {
  id: string;
  folio: string;
  supplier_id: string;
  supplier_name: string;
  supplier_is_system: boolean;
  status: PurchaseStatus;
  purchased_at: Date;
  reference: string | null;
  notes: string | null;
  total: string;
  item_count: number;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface PurchaseItemRow {
  id: string;
  product_id: string;
  inventory_movement_id: string | null;
  inventory_lot_id: string | null;
  position: number;
  product_name: string;
  product_sku: string | null;
  unit_name: string;
  unit_symbol: string;
  quantity: string;
  unit_cost: string;
  total: string;
}

interface ProductRow {
  id: string;
  kind: 'product' | 'service';
  name: string;
  sku: string | null;
  tracks_inventory: boolean;
  is_active: boolean;
  allows_decimals: boolean;
  unit_name: string;
  unit_symbol: string;
}

interface LockedPurchaseItem extends PurchaseItemRow {
  tracks_inventory: boolean;
}

interface PurchaseStatusHistoryRow {
  id: string;
  previous_status: PurchaseStatus | null;
  new_status: PurchaseStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  changed_at: Date;
}

@Injectable()
export class PurchasesService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(
    user: AuthenticatedUser,
    query: PurchaseQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const search = `%${this.escapeLike(query.search)}%`;
      const parameters = [query.status ?? null, query.supplierId ?? null, search];
      const where = `($1::varchar IS NULL OR purchase.status = $1)
        AND ($2::uuid IS NULL OR purchase.supplier_id = $2)
        AND ($3 = '%%' OR purchase.folio::text ILIKE $3 ESCAPE '\\'
          OR supplier.name ILIKE $3 ESCAPE '\\'
          OR COALESCE(purchase.reference, '') ILIKE $3 ESCAPE '\\')`;
      const countRows = (await runner.query(
        `SELECT count(*)::int AS total
         FROM ${schema}.purchases purchase
         JOIN ${schema}.suppliers supplier ON supplier.id = purchase.supplier_id
         WHERE ${where}`,
        parameters,
      )) as Array<{ total: number }>;
      const totalItems = countRows[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const rows = (await runner.query(
        `${this.purchaseSelect(schema)} WHERE ${where}
         ORDER BY purchase.purchased_at DESC, purchase.folio DESC
         LIMIT $4 OFFSET $5`,
        [...parameters, query.limit, offset],
      )) as PurchaseRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toSummary(row)),
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<PurchaseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) =>
      this.requirePurchase(runner, quoteIdentifier(schemaName), id),
    );
  }

  create(user: AuthenticatedUser, input: CreatePurchaseDto): Promise<PurchaseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      this.assertUniqueProducts(input.items);
      const supplierId = await this.requireActiveSupplier(runner, schema, input.supplierId);
      const rows = (await runner.query(
        `INSERT INTO ${schema}.purchases(
           supplier_id, purchased_at, reference, notes, created_by_user_id, updated_by_user_id
         ) VALUES ($1, COALESCE($2::timestamptz, now()), $3, $4, $5, $5)
         RETURNING id`,
        [
          supplierId,
          input.purchasedAt ?? null,
          input.reference ?? null,
          input.notes ?? null,
          user.id,
        ],
      )) as Array<{ id: string }>;
      const id = rows[0]!.id;
      await this.recordStatus(runner, schema, id, null, PurchaseStatus.Draft, user.id);
      await this.replaceItems(runner, schema, id, input.items);
      await this.recalculateTotal(runner, schema, id);
      return this.requirePurchase(runner, schema, id);
    });
  }

  update(
    user: AuthenticatedUser,
    id: string,
    input: UpdatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const current = await this.lockPurchase(runner, schema, id);
      if (current.status !== PurchaseStatus.Draft) {
        throw new BadRequestException('Solo las compras en borrador se pueden editar');
      }
      if (input.items) this.assertUniqueProducts(input.items);
      const supplierId =
        input.supplierId === undefined
          ? current.supplier_id
          : await this.requireActiveSupplier(runner, schema, input.supplierId);
      await runner.query(
        `UPDATE ${schema}.purchases SET
           supplier_id = $2,
           purchased_at = COALESCE($3::timestamptz, purchased_at),
           reference = CASE WHEN $4::boolean THEN $5 ELSE reference END,
           notes = CASE WHEN $6::boolean THEN $7 ELSE notes END,
           updated_by_user_id = $8, updated_at = now()
         WHERE id = $1`,
        [
          id,
          supplierId,
          input.purchasedAt ?? null,
          input.reference !== undefined,
          input.reference ?? null,
          input.notes !== undefined,
          input.notes ?? null,
          user.id,
        ],
      );
      if (input.items) {
        await runner.query(`DELETE FROM ${schema}.purchase_items WHERE purchase_id = $1`, [id]);
        await this.replaceItems(runner, schema, id, input.items);
        await this.recalculateTotal(runner, schema, id);
      }
      return this.requirePurchase(runner, schema, id);
    });
  }

  changeStatus(
    user: AuthenticatedUser,
    id: string,
    input: ChangePurchaseStatusDto,
  ): Promise<PurchaseResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const purchase = await this.lockPurchase(runner, schema, id);
      if (input.status === PurchaseStatus.Draft) {
        throw new BadRequestException('Una compra confirmada o cancelada no puede volver a borrador');
      }
      if (purchase.status === input.status) {
        throw new BadRequestException(
          input.status === PurchaseStatus.Confirmed
            ? 'La compra ya fue confirmada'
            : 'La compra ya fue cancelada',
        );
      }
      if (purchase.status === PurchaseStatus.Cancelled) {
        throw new BadRequestException('Una compra cancelada no puede cambiar de estado');
      }
      if (input.status === PurchaseStatus.Confirmed) {
        if (purchase.status !== PurchaseStatus.Draft) {
          throw new BadRequestException('La compra ya fue confirmada');
        }
        await this.confirm(runner, schema, purchase, user.id);
      } else {
        await this.cancel(runner, schema, purchase, user.id);
      }
      await this.recordStatus(runner, schema, id, purchase.status, input.status, user.id);
      return this.requirePurchase(runner, schema, id);
    });
  }

  private async confirm(
    runner: QueryRunner,
    schema: string,
    purchase: PurchaseRow,
    userId: string,
  ): Promise<void> {
    await this.requireActiveSupplier(runner, schema, purchase.supplier_id);
    const items = await this.lockItems(runner, schema, purchase.id);
    if (items.length === 0) throw new BadRequestException('La compra no tiene productos');
    for (const item of items) {
      const product = await this.requirePurchasableProduct(runner, schema, item.product_id, true);
      if (!product.allows_decimals && !Number.isInteger(Number(item.quantity))) {
        throw new BadRequestException(`La unidad de ${product.name} no permite decimales`);
      }
      if (!product.tracks_inventory) continue;
      const balances = (await runner.query(
        `UPDATE ${schema}.products_services
         SET stock = stock + $2, cost = $3, updated_by_user_id = $4, updated_at = now()
         WHERE id = $1
         RETURNING (stock - $2)::text AS previous_stock, stock::text AS resulting_stock`,
        [product.id, item.quantity, item.unit_cost, userId],
      )) as [Array<{ previous_stock: string; resulting_stock: string }>, number];
      const balance = balances[0][0]!;
      const movements = (await runner.query(
        `INSERT INTO ${schema}.inventory_movements(
           product_id, purchase_id, purchase_item_id,
           movement_type, quantity, previous_stock, resulting_stock,
           unit_cost, reason, created_by_user_id
         ) VALUES ($1, $2, $3, 'entry', $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          product.id,
          purchase.id,
          item.id,
          item.quantity,
          balance.previous_stock,
          balance.resulting_stock,
          item.unit_cost,
          `Compra #${purchase.folio}`,
          userId,
        ],
      )) as Array<{ id: string }>;
      const lots = (await runner.query(
        `INSERT INTO ${schema}.inventory_lots(
           product_id, purchase_item_id, received_quantity, remaining_quantity,
           unit_cost, received_at, source_type, source_reference, created_by_user_id,
           entry_movement_id
         ) VALUES ($1, $2, $3, $3, $4, $5, 'purchase', $6, $7, $8) RETURNING id`,
        [
          product.id,
          item.id,
          item.quantity,
          item.unit_cost,
          purchase.purchased_at,
          `Compra #${purchase.folio}`,
          userId,
          movements[0]!.id,
        ],
      )) as Array<{ id: string }>;
      await runner.query(`UPDATE ${schema}.inventory_movements SET lot_id = $2 WHERE id = $1`, [
        movements[0]!.id,
        lots[0]!.id,
      ]);
    }
    await runner.query(
      `UPDATE ${schema}.purchases
       SET status = 'confirmed', confirmed_at = now(), updated_by_user_id = $2, updated_at = now()
       WHERE id = $1`,
      [purchase.id, userId],
    );
  }

  private async cancel(
    runner: QueryRunner,
    schema: string,
    purchase: PurchaseRow,
    userId: string,
  ): Promise<void> {
    if (purchase.status === PurchaseStatus.Confirmed) {
      const items = await this.lockItems(runner, schema, purchase.id);
      for (const item of items.filter(({ tracks_inventory }) => tracks_inventory)) {
        const lots = (await runner.query(
          `SELECT id, received_quantity::text, remaining_quantity::text, entry_movement_id
           FROM ${schema}.inventory_lots WHERE purchase_item_id = $1 FOR UPDATE`,
          [item.id],
        )) as Array<{
          id: string;
          received_quantity: string;
          remaining_quantity: string;
          entry_movement_id: string | null;
        }>;
        const lot = lots[0];
        if (!lot || Number(lot.remaining_quantity) !== Number(lot.received_quantity)) {
          throw new UnprocessableEntityException(
            `No se puede cancelar: ya se consumió inventario de ${item.product_name}`,
          );
        }
        const balances = (await runner.query(
          `UPDATE ${schema}.products_services
           SET stock = stock - $2, updated_by_user_id = $3, updated_at = now()
           WHERE id = $1 AND stock >= $2
           RETURNING (stock + $2)::text AS previous_stock, stock::text AS resulting_stock`,
          [item.product_id, item.quantity, userId],
        )) as [Array<{ previous_stock: string; resulting_stock: string }>, number];
        const balance = balances[0][0];
        if (!balance) {
          throw new UnprocessableEntityException('La existencia actual impide cancelar la compra');
        }
        await runner.query(
          `INSERT INTO ${schema}.inventory_movements(
             product_id, lot_id, purchase_id, purchase_item_id,
             movement_type, quantity, previous_stock, resulting_stock,
             unit_cost, reason, created_by_user_id, reverses_movement_id
           ) VALUES ($1, $2, $3, $4, 'adjustment', -($5::numeric), $6, $7, $8, $9, $10, $11)`,
          [
            item.product_id,
            lot.id,
            purchase.id,
            item.id,
            item.quantity,
            balance.previous_stock,
            balance.resulting_stock,
            item.unit_cost,
            `Cancelación de compra #${purchase.folio}`,
            userId,
            lot.entry_movement_id,
          ],
        );
        await runner.query(
          `UPDATE ${schema}.inventory_lots SET remaining_quantity = 0 WHERE id = $1`,
          [lot.id],
        );
        await runner.query(
          `UPDATE ${schema}.products_services concept
           SET cost = COALESCE((
             SELECT other.unit_cost FROM ${schema}.inventory_lots other
             WHERE other.product_id = concept.id AND other.remaining_quantity > 0
             ORDER BY other.received_at DESC, other.id DESC LIMIT 1
           ), 0), updated_at = now(), updated_by_user_id = $2
           WHERE concept.id = $1`,
          [item.product_id, userId],
        );
      }
    }
    await runner.query(
      `UPDATE ${schema}.purchases
       SET status = 'cancelled', cancelled_at = now(), updated_by_user_id = $2, updated_at = now()
       WHERE id = $1`,
      [purchase.id, userId],
    );
  }

  private async replaceItems(
    runner: QueryRunner,
    schema: string,
    purchaseId: string,
    items: PurchaseItemInputDto[],
  ): Promise<void> {
    for (const [index, item] of items.entries()) {
      const product = await this.requirePurchasableProduct(runner, schema, item.productId, false);
      if (!product.allows_decimals && !Number.isInteger(item.quantity)) {
        throw new BadRequestException(`La unidad de ${product.name} no permite decimales`);
      }
      await runner.query(
        `INSERT INTO ${schema}.purchase_items(
           purchase_id, product_id, product_name, product_sku, unit_name, unit_symbol,
           quantity, unit_cost, total, position
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, round($7::numeric * $8::numeric, 2), $9)`,
        [
          purchaseId,
          product.id,
          product.name,
          product.sku,
          product.unit_name,
          product.unit_symbol,
          item.quantity,
          item.unitCost,
          index + 1,
        ],
      );
    }
  }

  private async recalculateTotal(
    runner: QueryRunner,
    schema: string,
    purchaseId: string,
  ): Promise<void> {
    await runner.query(
      `UPDATE ${schema}.purchases purchase
       SET total = COALESCE((
         SELECT sum(item.total) FROM ${schema}.purchase_items item
         WHERE item.purchase_id = purchase.id
       ), 0), updated_at = now()
       WHERE purchase.id = $1`,
      [purchaseId],
    );
  }

  private async requireActiveSupplier(
    runner: QueryRunner,
    schema: string,
    requestedId?: string,
  ): Promise<string> {
    const rows = (await runner.query(
      `SELECT id, is_active FROM ${schema}.suppliers
       WHERE id = COALESCE($1::uuid, (SELECT id FROM ${schema}.suppliers WHERE is_system = true))`,
      [requestedId ?? null],
    )) as Array<{ id: string; is_active: boolean }>;
    const supplier = rows[0];
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    if (!supplier.is_active) throw new UnprocessableEntityException('El proveedor está desactivado');
    return supplier.id;
  }

  private async requirePurchasableProduct(
    runner: QueryRunner,
    schema: string,
    id: string,
    lock: boolean,
  ): Promise<ProductRow> {
    const rows = (await runner.query(
      `SELECT concept.id, concept.kind, concept.name, concept.sku,
        concept.tracks_inventory, concept.is_active, unit.allows_decimals,
        unit.name AS unit_name, unit.symbol AS unit_symbol
       FROM ${schema}.products_services concept
       JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id
       WHERE concept.id = $1${lock ? ' FOR UPDATE OF concept' : ''}`,
      [id],
    )) as ProductRow[];
    const product = rows[0];
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.kind !== 'product') {
      throw new BadRequestException('Las compras solo admiten productos, no servicios');
    }
    if (!product.is_active) throw new UnprocessableEntityException(`${product.name} está desactivado`);
    return product;
  }

  private async lockPurchase(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<PurchaseRow> {
    const rows = (await runner.query(
      `${this.purchaseSelect(schema)} WHERE purchase.id = $1 FOR UPDATE OF purchase`,
      [id],
    )) as PurchaseRow[];
    const purchase = rows[0];
    if (!purchase) throw new NotFoundException('Compra no encontrada');
    return purchase;
  }

  private async lockItems(
    runner: QueryRunner,
    schema: string,
    purchaseId: string,
  ): Promise<LockedPurchaseItem[]> {
    return (await runner.query(
      `SELECT item.id, item.product_id, item.position, item.product_name, item.product_sku,
        item.unit_name, item.unit_symbol, item.quantity::text, item.unit_cost::text,
        item.total::text, concept.tracks_inventory
       FROM ${schema}.purchase_items item
       JOIN ${schema}.products_services concept ON concept.id = item.product_id
       WHERE item.purchase_id = $1 ORDER BY item.position FOR UPDATE OF item`,
      [purchaseId],
    )) as LockedPurchaseItem[];
  }

  private async requirePurchase(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<PurchaseResponseDto> {
    const rows = (await runner.query(`${this.purchaseSelect(schema)} WHERE purchase.id = $1`, [
      id,
    ])) as PurchaseRow[];
    const row = rows[0];
    if (!row) throw new NotFoundException('Compra no encontrada');
    const items = (await runner.query(
      `SELECT item.id, item.product_id, item.position, item.product_name, item.product_sku,
        item.unit_name, item.unit_symbol, item.quantity::text, item.unit_cost::text,
        item.total::text, lot.id AS inventory_lot_id,
        lot.entry_movement_id AS inventory_movement_id
       FROM ${schema}.purchase_items item
       LEFT JOIN ${schema}.inventory_lots lot ON lot.purchase_item_id = item.id
       WHERE item.purchase_id = $1 ORDER BY item.position`,
      [id],
    )) as PurchaseItemRow[];
    const statusHistory = (await runner.query(
      `SELECT history.id, history.previous_status, history.new_status,
        history.changed_by_user_id, platform_user.full_name AS changed_by_name,
        history.changed_at
       FROM ${schema}.purchase_status_history history
       JOIN public.users platform_user ON platform_user.id = history.changed_by_user_id
       WHERE history.purchase_id = $1
       ORDER BY history.changed_at, history.id`,
      [id],
    )) as PurchaseStatusHistoryRow[];
    return {
      ...this.toSummary(row),
      items: items.map((item) => this.toItem(item)),
      statusHistory: statusHistory.map((history) => this.toStatusHistory(history)),
    };
  }

  private async recordStatus(
    runner: QueryRunner,
    schema: string,
    purchaseId: string,
    previousStatus: PurchaseStatus | null,
    newStatus: PurchaseStatus,
    userId: string,
  ): Promise<void> {
    await runner.query(
      `INSERT INTO ${schema}.purchase_status_history(
         purchase_id, previous_status, new_status, changed_by_user_id
       ) VALUES ($1, $2, $3, $4)`,
      [purchaseId, previousStatus, newStatus, userId],
    );
  }

  private purchaseSelect(schema: string): string {
    return `SELECT purchase.id, purchase.folio::text, purchase.supplier_id,
      supplier.name AS supplier_name, supplier.is_system AS supplier_is_system,
      purchase.status, purchase.purchased_at, purchase.reference, purchase.notes,
      purchase.total::text,
      (SELECT count(*)::int FROM ${schema}.purchase_items item
       WHERE item.purchase_id = purchase.id) AS item_count,
      purchase.confirmed_at, purchase.cancelled_at,
      purchase.created_by_user_id, purchase.updated_by_user_id,
      purchase.created_at, purchase.updated_at
      FROM ${schema}.purchases purchase
      JOIN ${schema}.suppliers supplier ON supplier.id = purchase.supplier_id`;
  }

  private toSummary(row: PurchaseRow): PurchaseSummaryResponseDto {
    return {
      id: row.id,
      folio: row.folio,
      status: row.status,
      supplier: {
        id: row.supplier_id,
        commercialName: row.supplier_name,
        isDefault: row.supplier_is_system,
      },
      purchasedAt: row.purchased_at,
      reference: row.reference,
      notes: row.notes,
      total: row.total,
      itemCount: row.item_count,
      confirmedAt: row.confirmed_at,
      cancelledAt: row.cancelled_at,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toItem(row: PurchaseItemRow): PurchaseItemResponseDto {
    return {
      id: row.id,
      productId: row.product_id,
      inventoryMovementId: row.inventory_movement_id,
      inventoryLotId: row.inventory_lot_id,
      position: row.position,
      productName: row.product_name,
      productSku: row.product_sku,
      unitName: row.unit_name,
      unitSymbol: row.unit_symbol,
      quantity: row.quantity,
      unitCost: row.unit_cost,
      amount: row.total,
    };
  }

  private toStatusHistory(row: PurchaseStatusHistoryRow): PurchaseStatusHistoryResponseDto {
    return {
      id: row.id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      changedByUserId: row.changed_by_user_id,
      changedByName: row.changed_by_name,
      changedAt: row.changed_at,
    };
  }

  private assertUniqueProducts(items: PurchaseItemInputDto[]): void {
    if (new Set(items.map(({ productId }) => productId)).size !== items.length) {
      throw new BadRequestException('Cada producto debe aparecer una sola vez en la compra');
    }
  }

  private escapeLike(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }
}
