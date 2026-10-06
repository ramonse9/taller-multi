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
  ChangeOrderStatusDto,
  ChangeOrderPaymentStatusDto,
  CreateOrderDto,
  CreateOrderNoteDto,
  OrderItemInputDto,
  OrderItemKind,
  OrderItemResponseDto,
  OrderListItemResponseDto,
  OrderNoteResponseDto,
  OrderQueryDto,
  OrderResponseDto,
  OrderStatus,
  OrderStatusHistoryResponseDto,
  OrderSummaryResponseDto,
  PaginatedOrdersResponseDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { unknownOrderItemCostSql } from './order-cost-rules';

interface OrderRow {
  id: string;
  folio: string;
  external_folio: string | null;
  customer_id: string;
  customer_type: 'person' | 'company';
  customer_name: string;
  vehicle_id: string;
  brand_name: string;
  model_name: string;
  model_year: number;
  color: string;
  serial_number: string | null;
  license_plate: string | null;
  status: OrderStatus;
  subtotal: string | null;
  total: string | null;
  total_cost: string | null;
  gross_profit: string | null;
  inventory_applied_at: Date | null;
  has_unpriced_items: boolean;
  has_unknown_costs: boolean;
  is_paid: boolean;
  paid_at: Date | null;
  item_count: string;
  opened_at: Date;
  closed_at: Date | null;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface LockedOrderRow {
  id: string;
  folio: string;
  external_folio: string | null;
  customer_id: string;
  vehicle_id: string;
  status: OrderStatus;
  inventory_applied_at: Date | null;
  is_paid: boolean;
  total: string | null;
}

interface OrderItemRow {
  id: string;
  product_service_id: string | null;
  kind: OrderItemKind;
  affects_order_total: boolean;
  position: number;
  description: string;
  unit_name: string;
  unit_symbol: string;
  quantity: string;
  unit_price: string | null;
  total: string | null;
  unit_cost: string | null;
  cost_total: string | null;
  tracks_inventory: boolean;
}

interface OrderItemCostLayerRow {
  order_item_id: string;
  lot_id: string;
  quantity: string;
  unit_cost: string;
  cost_amount: string;
}

interface CatalogConceptRow {
  id: string;
  kind: OrderItemKind;
  name: string;
  cost: string;
  unit_price: string;
  tracks_inventory: boolean;
  is_active: boolean;
  unit_name: string;
  unit_symbol: string;
  unit_allows_decimals: boolean;
}

interface InventoryOrderItemRow {
  id: string;
  product_service_id: string;
  description: string;
  quantity: string;
  unit_cost: string | null;
}

interface InventoryLotRow {
  id: string;
  remaining_quantity: string;
  unit_cost: string;
}

interface InventoryAllocationRow {
  lot_id: string;
  quantity: string;
  unit_cost: string;
}

interface InventoryCostResult {
  unitCost: string;
  totalCost: string;
}

interface OrderNoteRow {
  id: string;
  body: string;
  created_by_user_id: string;
  created_by_name: string;
  created_at: Date;
}

interface OrderStatusHistoryRow {
  id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  changed_at: Date;
}

const transitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.InProgress]: [OrderStatus.Completed, OrderStatus.Cancelled],
  [OrderStatus.Completed]: [OrderStatus.InProgress, OrderStatus.Cancelled],
  [OrderStatus.Cancelled]: [OrderStatus.InProgress],
};

@Injectable()
export class OrdersService {
  constructor(private readonly tenant: TenantSessionService) {}

  list(user: AuthenticatedUser, query: OrderQueryDto): Promise<PaginatedOrdersResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const offset = (query.page - 1) * query.limit;
      const escapedSearch = query.search.trim().replace(/[\\%_]/g, '\\$&');
      const filter = `%${escapedSearch}%`;
      const parameters = [
        query.status ?? null,
        query.customerId ?? null,
        query.vehicleId ?? null,
        filter,
        query.isPaid ?? null,
      ];
      const where = `($1::text IS NULL OR service_order.status = $1)
        AND ($2::uuid IS NULL OR service_order.customer_id = $2)
        AND ($3::uuid IS NULL OR service_order.vehicle_id = $3)
        AND ($4 = '%%' OR service_order.folio::text ILIKE $4 ESCAPE '\\'
          OR COALESCE(service_order.external_folio, '') ILIKE $4 ESCAPE '\\'
          OR customer.display_name ILIKE $4 ESCAPE '\\'
          OR COALESCE(vehicle.license_plate, '') ILIKE $4 ESCAPE '\\'
          OR COALESCE(vehicle.serial_number, '') ILIKE $4 ESCAPE '\\'
          OR brand.name ILIKE $4 ESCAPE '\\'
          OR model.name ILIKE $4 ESCAPE '\\')
        AND ($5::boolean IS NULL OR (
          service_order.is_paid = $5
          AND ($5 = true OR service_order.status <> 'cancelled')
        ))`;
      const countRows = (await runner.query(
        `SELECT COUNT(*) AS total
         FROM ${schema}.orders service_order
         JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
         JOIN ${schema}.vehicles vehicle ON vehicle.id = service_order.vehicle_id
         JOIN public.vehicle_brands brand ON brand.id = vehicle.brand_id
         JOIN public.vehicle_models model ON model.id = vehicle.model_id
         WHERE ${where}`,
        parameters,
      )) as Array<{ total: string }>;
      const totalItems = Number(countRows[0]?.total ?? 0);
      const rows = (await runner.query(
        `${this.orderSelect(schema)} WHERE ${where}
         ORDER BY service_order.created_at DESC, service_order.id DESC LIMIT $6 OFFSET $7`,
        [...parameters, query.limit, offset],
      )) as OrderRow[];
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + rows.length < totalItems,
        items: rows.map((row) => this.toListResponse(row)),
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<OrderResponseDto> {
    return this.tenant.run(user, (runner, schemaName) =>
      this.getOrder(runner, quoteIdentifier(schemaName), id),
    );
  }

  create(user: AuthenticatedUser, input: CreateOrderDto): Promise<OrderResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      await this.validateCustomerVehicle(runner, schema, input.customerId, input.vehicleId);
      this.assertNewFreeItemPrices(input.items);
      const rows = (await runner.query(
        `INSERT INTO ${schema}.orders(
           customer_id, vehicle_id, external_folio, status, subtotal, tax, total,
           created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, $3, 'in_progress', NULL, 0, NULL, $4, $4) RETURNING id`,
        [input.customerId, input.vehicleId, input.externalFolio ?? null, user.id],
      )) as Array<{ id: string }>;
      const orderId = rows[0]?.id;
      if (!orderId) throw new Error('No se pudo crear la orden');
      await this.replaceItems(runner, schema, orderId, input.items, user);
      await runner.query(
        `INSERT INTO ${schema}.order_status_history(
           order_id, previous_status, new_status, changed_by_user_id
         ) VALUES ($1, NULL, 'in_progress', $2)`,
        [orderId, user.id],
      );
      await this.recalculate(runner, schema, orderId, user.id);
      return this.getOrder(runner, schema, orderId);
    });
  }

  update(user: AuthenticatedUser, id: string, input: UpdateOrderDto): Promise<OrderResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const order = await this.lockOrder(runner, schema, id);
      this.assertEditable(order.status);
      if (order.is_paid) {
        throw new BadRequestException('Marca la orden como pendiente antes de modificarla');
      }
      if (
        input.customerId === undefined &&
        input.vehicleId === undefined &&
        input.externalFolio === undefined &&
        input.items === undefined
      ) {
        throw new BadRequestException('No hay cambios para aplicar');
      }
      const customerId = input.customerId ?? order.customer_id;
      const vehicleId = input.vehicleId ?? order.vehicle_id;
      await this.validateCustomerVehicle(runner, schema, customerId, vehicleId);
      if (
        input.customerId !== undefined ||
        input.vehicleId !== undefined ||
        input.externalFolio !== undefined
      ) {
        await runner.query(
          `UPDATE ${schema}.orders
           SET customer_id = $1, vehicle_id = $2, external_folio = $3,
               updated_by_user_id = $4, updated_at = now()
           WHERE id = $5`,
          [
            customerId,
            vehicleId,
            input.externalFolio === undefined ? order.external_folio : input.externalFolio,
            user.id,
            id,
          ],
        );
      }
      if (input.items !== undefined) {
        this.assertNewFreeItemPrices(input.items);
        await this.replaceItems(runner, schema, id, input.items, user);
        await this.recalculate(runner, schema, id, user.id);
      }
      return this.getOrder(runner, schema, id);
    });
  }

  changeStatus(
    user: AuthenticatedUser,
    id: string,
    input: ChangeOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const order = await this.lockOrder(runner, schema, id);
      if (!transitions[order.status].includes(input.status)) {
        throw new BadRequestException(
          `No se puede cambiar una orden de ${order.status} a ${input.status}`,
        );
      }
      if (input.status === OrderStatus.Cancelled && order.is_paid) {
        throw new BadRequestException('Marca la orden como pendiente antes de cancelarla');
      }
      if (input.status === OrderStatus.Completed) {
        await this.applyInventory(runner, schema, order, user.id);
      } else if (order.status === OrderStatus.Completed) {
        await this.returnInventory(runner, schema, order, user.id);
      }
      await runner.query(
        `UPDATE ${schema}.orders
         SET status = $1::varchar(24),
             closed_at = CASE WHEN $1::varchar(24) IN ('completed', 'cancelled') THEN now() ELSE NULL END,
             updated_by_user_id = $2, updated_at = now()
         WHERE id = $3`,
        [input.status, user.id, id],
      );
      await runner.query(
        `INSERT INTO ${schema}.order_status_history(
           order_id, previous_status, new_status, changed_by_user_id
         ) VALUES ($1, $2, $3, $4)`,
        [id, order.status, input.status, user.id],
      );
      return this.getOrder(runner, schema, id);
    });
  }

  changePaymentStatus(
    user: AuthenticatedUser,
    id: string,
    input: ChangeOrderPaymentStatusDto,
  ): Promise<OrderResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const order = await this.lockOrder(runner, schema, id);
      if (order.status === OrderStatus.Cancelled && input.isPaid) {
        throw new BadRequestException('Una orden cancelada no puede marcarse como pagada');
      }
      if (order.is_paid === input.isPaid) {
        throw new BadRequestException(
          input.isPaid ? 'La orden ya está pagada' : 'La orden ya está pendiente de pago',
        );
      }
      if (input.isPaid && order.total === null) {
        throw new BadRequestException(
          'Define todos los precios antes de marcar la orden como pagada',
        );
      }
      await runner.query(
        `UPDATE ${schema}.orders
         SET is_paid = $2, paid_at = CASE WHEN $2 THEN now() ELSE NULL END,
             updated_by_user_id = $3, updated_at = now()
         WHERE id = $1`,
        [id, input.isPaid, user.id],
      );
      return this.getOrder(runner, schema, id);
    });
  }

  addNote(
    user: AuthenticatedUser,
    id: string,
    input: CreateOrderNoteDto,
  ): Promise<OrderNoteResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      await this.lockOrder(runner, schema, id);
      const rows = (await runner.query(
        `WITH inserted AS (
           INSERT INTO ${schema}.order_notes(order_id, body, created_by_user_id)
           VALUES ($1, $2, $3)
           RETURNING id, body, created_by_user_id, created_at
         )
         SELECT inserted.*, platform_user.full_name AS created_by_name
         FROM inserted JOIN public.users platform_user ON platform_user.id = inserted.created_by_user_id`,
        [id, input.body, user.id],
      )) as OrderNoteRow[];
      const note = rows[0];
      if (!note) throw new Error('No se pudo agregar la nota');
      return {
        id: note.id,
        body: note.body,
        createdByUserId: note.created_by_user_id,
        createdByName: note.created_by_name,
        createdAt: note.created_at,
      };
    });
  }

  private async getOrder(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<OrderResponseDto> {
    const rows = (await runner.query(`${this.orderSelect(schema)} WHERE service_order.id = $1`, [
      id,
    ])) as OrderRow[];
    const row = rows[0];
    if (!row) throw new NotFoundException('Orden no encontrada');
    const items = (await runner.query(
      `SELECT id, product_service_id, kind, affects_order_total, position, description, unit_name, unit_symbol,
              quantity, unit_price, total, unit_cost, cost_total, tracks_inventory
       FROM ${schema}.order_items WHERE order_id = $1 ORDER BY position`,
      [id],
    )) as OrderItemRow[];
    const costLayers = (await runner.query(
      `WITH latest_exit AS (
         SELECT DISTINCT ON (movement.order_item_id)
                movement.order_item_id, movement.id
         FROM ${schema}.inventory_movements movement
         WHERE movement.order_id = $1
           AND movement.order_item_id IS NOT NULL
           AND movement.movement_type = 'exit'
         ORDER BY movement.order_item_id, movement.created_at DESC, movement.id DESC
       )
       SELECT latest_exit.order_item_id, allocation.lot_id,
              allocation.quantity::text, allocation.unit_cost::text,
              round(allocation.quantity * allocation.unit_cost, 2)::text AS cost_amount
       FROM latest_exit
       JOIN ${schema}.inventory_lot_allocations allocation
         ON allocation.movement_id = latest_exit.id
       JOIN ${schema}.inventory_lots lot ON lot.id = allocation.lot_id
       ORDER BY latest_exit.order_item_id, lot.received_at, lot.id`,
      [id],
    )) as OrderItemCostLayerRow[];
    const costLayersByItem = new Map<string, OrderItemCostLayerRow[]>();
    for (const layer of costLayers) {
      const current = costLayersByItem.get(layer.order_item_id) ?? [];
      current.push(layer);
      costLayersByItem.set(layer.order_item_id, current);
    }
    const notes = (await runner.query(
      `SELECT note.id, note.body, note.created_by_user_id,
              platform_user.full_name AS created_by_name, note.created_at
       FROM ${schema}.order_notes note
       JOIN public.users platform_user ON platform_user.id = note.created_by_user_id
       WHERE note.order_id = $1 ORDER BY note.created_at, note.id`,
      [id],
    )) as OrderNoteRow[];
    const statusHistory = (await runner.query(
      `SELECT history.id, history.previous_status, history.new_status,
              history.changed_by_user_id, platform_user.full_name AS changed_by_name,
              history.changed_at
       FROM ${schema}.order_status_history history
       JOIN public.users platform_user ON platform_user.id = history.changed_by_user_id
       WHERE history.order_id = $1 ORDER BY history.changed_at, history.id`,
      [id],
    )) as OrderStatusHistoryRow[];
    return {
      ...this.toBaseResponse(row),
      items: items.map<OrderItemResponseDto>((item) => ({
        id: item.id,
        productServiceId: item.product_service_id,
        kind: item.kind,
        affectsOrderTotal: item.affects_order_total,
        position: item.position,
        description: item.description,
        unitName: item.unit_name,
        unitSymbol: item.unit_symbol,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.total,
        unitCost: item.unit_cost,
        costAmount: item.cost_total,
        tracksInventory: item.tracks_inventory,
        costLayers: (costLayersByItem.get(item.id) ?? []).map((layer) => ({
          lotId: layer.lot_id,
          quantity: layer.quantity,
          unitCost: layer.unit_cost,
          costAmount: layer.cost_amount,
        })),
      })),
      notes: notes.map<OrderNoteResponseDto>((note) => ({
        id: note.id,
        body: note.body,
        createdByUserId: note.created_by_user_id,
        createdByName: note.created_by_name,
        createdAt: note.created_at,
      })),
      statusHistory: statusHistory.map<OrderStatusHistoryResponseDto>((history) => ({
        id: history.id,
        previousStatus: history.previous_status,
        newStatus: history.new_status,
        changedByUserId: history.changed_by_user_id,
        changedByName: history.changed_by_name,
        changedAt: history.changed_at,
      })),
    };
  }

  private async replaceItems(
    runner: QueryRunner,
    schema: string,
    orderId: string,
    items: OrderItemInputDto[],
    user: AuthenticatedUser,
  ): Promise<void> {
    const existingItems = (await runner.query(
      `SELECT id, product_service_id, kind, affects_order_total, position, description, unit_name, unit_symbol,
              quantity, unit_price, total, unit_cost, cost_total, tracks_inventory
       FROM ${schema}.order_items WHERE order_id = $1`,
      [orderId],
    )) as OrderItemRow[];
    const existingById = new Map(existingItems.map((item) => [item.id, item]));
    await runner.query(`DELETE FROM ${schema}.order_items WHERE order_id = $1`, [orderId]);
    for (const [index, item] of items.entries()) {
      let productServiceId: string | null = null;
      let kind = item.kind ?? OrderItemKind.Service;
      let description = item.description ?? '';
      let unitName = kind === OrderItemKind.Service ? 'Servicio' : 'Unidad';
      let unitSymbol = kind === OrderItemKind.Service ? 'serv' : 'u';
      let affectsOrderTotal = item.affectsOrderTotal;
      let unitPrice = item.unitPrice === undefined ? null : item.unitPrice;
      let unitCost = item.unitCost ?? null;
      let tracksInventory = false;
      const existing = item.itemId ? existingById.get(item.itemId) : undefined;
      if (item.itemId && !existing) {
        throw new BadRequestException('Uno de los conceptos ya no pertenece a la orden');
      }
      if (existing?.product_service_id) {
        if (
          item.productServiceId !== undefined &&
          item.productServiceId !== null &&
          item.productServiceId !== existing.product_service_id
        ) {
          throw new BadRequestException(
            'No se puede sustituir el catálogo de un concepto existente',
          );
        }
        productServiceId = existing.product_service_id;
        kind = existing.kind;
        affectsOrderTotal ??= existing.affects_order_total;
        description = existing.description;
        unitName = existing.unit_name;
        unitSymbol = existing.unit_symbol;
        unitPrice =
          item.unitPrice === undefined
            ? existing.unit_price === null
              ? null
              : Number(existing.unit_price)
            : item.unitPrice;
        unitCost = existing.unit_cost === null ? null : Number(existing.unit_cost);
        tracksInventory = existing.tracks_inventory;
      } else if (item.productServiceId) {
        if (!user.subscription?.features.includes('item_catalog')) {
          throw new UnprocessableEntityException(
            'El plan actual no permite agregar conceptos desde el catálogo',
          );
        }
        const concept = await this.getActiveConcept(runner, schema, item.productServiceId);
        if (!concept.unit_allows_decimals && !Number.isInteger(item.quantity)) {
          throw new UnprocessableEntityException(
            `La unidad de ${concept.name} no permite cantidades decimales`,
          );
        }
        productServiceId = concept.id;
        kind = concept.kind;
        affectsOrderTotal ??= kind === OrderItemKind.Service;
        description = concept.name;
        unitName = concept.unit_name;
        unitSymbol = concept.unit_symbol;
        unitPrice =
          item.unitPrice === undefined
            ? affectsOrderTotal
              ? Number(concept.unit_price)
              : null
            : item.unitPrice;
        unitCost = Number(concept.cost);
        tracksInventory = concept.tracks_inventory;
      } else {
        if (!user.subscription?.features.includes('free_order_items')) {
          throw new UnprocessableEntityException('El plan actual no permite conceptos libres');
        }
        kind = item.kind ?? existing?.kind ?? OrderItemKind.Service;
        affectsOrderTotal ??= existing?.affects_order_total ?? kind === OrderItemKind.Service;
        if (existing && item.unitPrice === undefined) {
          unitPrice = existing.unit_price === null ? null : Number(existing.unit_price);
        }
        if (existing && item.unitCost === undefined) {
          unitCost = existing.unit_cost === null ? null : Number(existing.unit_cost);
        }
        unitName = kind === OrderItemKind.Service ? 'Servicio' : 'Unidad';
        unitSymbol = kind === OrderItemKind.Service ? 'serv' : 'u';
      }
      affectsOrderTotal ??= kind === OrderItemKind.Service;
      if (affectsOrderTotal && unitPrice === null && !existing) {
        throw new UnprocessableEntityException(
          `El concepto ${description || index + 1} necesita un precio unitario`,
        );
      }
      const amount = affectsOrderTotal
        ? unitPrice === null
          ? null
          : this.amount(item.quantity, unitPrice)
        : '0.00';
      const costAmount = unitCost === null ? null : this.amount(item.quantity, unitCost);
      await runner.query(
        `INSERT INTO ${schema}.order_items(
           order_id, product_service_id, kind, affects_order_total, description, unit_name, unit_symbol,
           quantity, unit_price, total, unit_cost, cost_total, tracks_inventory, position
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          orderId,
          productServiceId,
          kind,
          affectsOrderTotal,
          description,
          unitName,
          unitSymbol,
          item.quantity.toFixed(3),
          unitPrice === null ? null : unitPrice.toFixed(2),
          amount,
          unitCost === null ? null : unitCost.toFixed(2),
          costAmount,
          tracksInventory,
          index + 1,
        ],
      );
    }
  }

  private async recalculate(
    runner: QueryRunner,
    schema: string,
    orderId: string,
    userId: string,
  ): Promise<void> {
    await runner.query(
      `UPDATE ${schema}.orders service_order
       SET subtotal = totals.total, total = totals.total, tax = 0,
           total_cost = totals.total_cost,
           gross_profit = CASE
             WHEN totals.total IS NULL OR totals.has_unknown_costs THEN NULL
             ELSE totals.total - totals.total_cost
           END,
           updated_by_user_id = $2, updated_at = now()
       FROM (
         SELECT CASE
           WHEN COUNT(*) FILTER (WHERE affects_order_total AND total IS NULL) > 0 THEN NULL
           ELSE COALESCE(SUM(total) FILTER (WHERE affects_order_total), 0)
         END AS total,
         COALESCE(SUM(item.cost_total), 0) AS total_cost,
         COUNT(*) FILTER (WHERE ${unknownOrderItemCostSql('item')}) > 0 AS has_unknown_costs
         FROM ${schema}.order_items item WHERE item.order_id = $1
       ) totals
       WHERE service_order.id = $1`,
      [orderId, userId],
    );
  }

  private amount(quantity: number, unitPrice: number): string {
    const quantityThousandths = BigInt(Math.round(quantity * 1000));
    const priceCents = BigInt(Math.round(unitPrice * 100));
    const amountCents = (quantityThousandths * priceCents + 500n) / 1000n;
    const whole = amountCents / 100n;
    const cents = String(amountCents % 100n).padStart(2, '0');
    return `${whole}.${cents}`;
  }

  private async validateCustomerVehicle(
    runner: QueryRunner,
    schema: string,
    customerId: string,
    vehicleId: string,
  ): Promise<void> {
    const rows = (await runner.query(
      `SELECT 1
       FROM ${schema}.customers customer
       JOIN ${schema}.vehicles vehicle
         ON vehicle.id = $2 AND vehicle.customer_id = customer.id AND vehicle.is_active = TRUE
       WHERE customer.id = $1 AND customer.is_active = TRUE`,
      [customerId, vehicleId],
    )) as unknown[];
    if (!rows[0]) {
      throw new UnprocessableEntityException(
        'El cliente y el vehículo deben estar activos, y el vehículo debe pertenecer al cliente',
      );
    }
  }

  private async lockOrder(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<LockedOrderRow> {
    const rows = (await runner.query(
      `SELECT id, folio::text AS folio, external_folio, customer_id, vehicle_id, status,
              inventory_applied_at,
              is_paid, total::text
       FROM ${schema}.orders WHERE id = $1 FOR UPDATE`,
      [id],
    )) as LockedOrderRow[];
    if (!rows[0]) throw new NotFoundException('Orden no encontrada');
    return rows[0];
  }

  private assertEditable(status: OrderStatus): void {
    if (status === OrderStatus.Completed || status === OrderStatus.Cancelled) {
      throw new BadRequestException('La orden ya no permite modificar sus datos o conceptos');
    }
  }

  private assertNewFreeItemPrices(items: OrderItemInputDto[]): void {
    const missing = items.find(
      (item) =>
        !item.itemId &&
        !item.productServiceId &&
        (item.affectsOrderTotal ?? item.kind !== OrderItemKind.Product) &&
        (item.unitPrice === undefined || item.unitPrice === null),
    );
    if (missing) {
      throw new UnprocessableEntityException(
        `El concepto ${missing.description || 'nuevo'} necesita un precio unitario`,
      );
    }
  }

  private async getActiveConcept(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<CatalogConceptRow> {
    const rows = (await runner.query(
      `SELECT concept.id, concept.kind, concept.name, concept.cost, concept.unit_price,
              concept.tracks_inventory, concept.is_active,
              unit.name AS unit_name, unit.symbol AS unit_symbol,
              unit.allows_decimals AS unit_allows_decimals
       FROM ${schema}.products_services concept
       JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id
       WHERE concept.id = $1 FOR SHARE OF concept, unit`,
      [id],
    )) as CatalogConceptRow[];
    const concept = rows[0];
    if (!concept) throw new NotFoundException('Concepto de catálogo no encontrado');
    if (!concept.is_active) {
      throw new UnprocessableEntityException(`El concepto ${concept.name} está desactivado`);
    }
    return concept;
  }

  private async applyInventory(
    runner: QueryRunner,
    schema: string,
    order: LockedOrderRow,
    userId: string,
  ): Promise<void> {
    if (order.inventory_applied_at) return;
    const items = await this.inventoryItems(runner, schema, order.id);
    if (items.length === 0) return;
    for (const item of items) {
      const quantity = Number(item.quantity);
      const updated = (await runner.query(
        `UPDATE ${schema}.products_services
         SET stock = stock - $2, updated_by_user_id = $3, updated_at = now()
         WHERE id = $1 AND stock >= $2
         RETURNING (stock + $2)::text AS previous_stock, stock::text AS resulting_stock`,
        [item.product_service_id, quantity, userId],
      )) as [Array<{ previous_stock: string; resulting_stock: string }>, number];
      const balance = updated[0][0];
      if (!balance) {
        throw new UnprocessableEntityException(
          `No hay existencia suficiente para terminar la orden: ${item.description}`,
        );
      }
      const movements = (await runner.query(
        `INSERT INTO ${schema}.inventory_movements(
           product_id, order_item_id, order_id, movement_type, quantity,
           previous_stock, resulting_stock, unit_cost, reason, created_by_user_id
         ) VALUES ($1, $2, $3, 'exit', $4, $5, $6, NULL, $7, $8)
         RETURNING id`,
        [
          item.product_service_id,
          item.id,
          order.id,
          -quantity,
          balance.previous_stock,
          balance.resulting_stock,
          `Salida por orden #${order.folio}`,
          userId,
        ],
      )) as Array<{ id: string }>;
      const movementId = movements[0]!.id;
      const actualCost = await this.consumeOrderLots(
        runner,
        schema,
        item.product_service_id,
        movementId,
        quantity,
        item.description,
      );
      await runner.query(
        `UPDATE ${schema}.order_items
         SET unit_cost = $2, cost_total = $3 WHERE id = $1`,
        [item.id, actualCost.unitCost, actualCost.totalCost],
      );
    }
    await this.recalculate(runner, schema, order.id, userId);
    await runner.query(
      `UPDATE ${schema}.orders
       SET inventory_applied_at = now(), updated_by_user_id = $2, updated_at = now()
       WHERE id = $1`,
      [order.id, userId],
    );
  }

  private async returnInventory(
    runner: QueryRunner,
    schema: string,
    order: LockedOrderRow,
    userId: string,
  ): Promise<void> {
    if (!order.inventory_applied_at) return;
    const items = await this.inventoryItems(runner, schema, order.id);
    for (const item of items) {
      const quantity = Number(item.quantity);
      const exitMovements = (await runner.query(
        `SELECT movement.id FROM ${schema}.inventory_movements movement
         WHERE movement.order_item_id = $1
           AND movement.order_id = $2
           AND movement.movement_type = 'exit'
           AND NOT EXISTS (
             SELECT 1 FROM ${schema}.inventory_movements reversal
             WHERE reversal.reverses_movement_id = movement.id
           )
         ORDER BY movement.created_at DESC LIMIT 1
         FOR UPDATE`,
        [item.id, order.id],
      )) as Array<{ id: string }>;
      const exitMovement = exitMovements[0];
      if (!exitMovement) {
        throw new UnprocessableEntityException(
          `La salida de inventario ya fue devuelta o no existe: ${item.description}`,
        );
      }
      const allocations = exitMovement
        ? ((await runner.query(
            `SELECT lot_id, quantity::text, unit_cost::text
             FROM ${schema}.inventory_lot_allocations
             WHERE movement_id = $1 ORDER BY created_at, id`,
            [exitMovement.id],
          )) as InventoryAllocationRow[])
        : [];
      const actualCost = await this.allocationCost(runner, schema, exitMovement.id);
      const updated = (await runner.query(
        `UPDATE ${schema}.products_services
         SET stock = stock + $2, updated_by_user_id = $3, updated_at = now()
         WHERE id = $1
         RETURNING (stock - $2)::text AS previous_stock, stock::text AS resulting_stock`,
        [item.product_service_id, quantity, userId],
      )) as [Array<{ previous_stock: string; resulting_stock: string }>, number];
      const balance = updated[0][0];
      if (!balance) throw new NotFoundException(`Producto no encontrado: ${item.description}`);
      for (const allocation of allocations) {
        const restored = (await runner.query(
          `UPDATE ${schema}.inventory_lots
           SET remaining_quantity = remaining_quantity + $2
           WHERE id = $1 AND remaining_quantity + $2 <= received_quantity
           RETURNING id`,
          [allocation.lot_id, allocation.quantity],
        )) as [Array<{ id: string }>, number];
        if (!restored[0][0]) {
          throw new UnprocessableEntityException(
            `No se pudo devolver el lote consumido por: ${item.description}`,
          );
        }
      }
      const movements = (await runner.query(
        `INSERT INTO ${schema}.inventory_movements(
           product_id, order_item_id, order_id, movement_type, quantity,
           previous_stock, resulting_stock, unit_cost, reason, created_by_user_id,
           reverses_movement_id
         ) VALUES ($1, $2, $3, 'entry', $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          item.product_service_id,
          item.id,
          order.id,
          quantity,
          balance.previous_stock,
          balance.resulting_stock,
          actualCost?.unitCost ?? item.unit_cost,
          `Devolución por cambio de estado de la orden #${order.folio}`,
          userId,
          exitMovement.id,
        ],
      )) as Array<{ id: string }>;
      if (allocations.length === 0) {
        const unitCost = actualCost?.unitCost ?? item.unit_cost ?? '0.00';
        const lots = (await runner.query(
          `INSERT INTO ${schema}.inventory_lots(
             product_id, received_quantity, remaining_quantity, unit_cost,
             source_type, source_reference, created_by_user_id, entry_movement_id
           ) VALUES ($1, $2, $2, $3, 'order_return', $4, $5, $6)
           RETURNING id`,
          [
            item.product_service_id,
            quantity,
            unitCost,
            `Devolución de orden #${order.folio}`,
            userId,
            movements[0]!.id,
          ],
        )) as Array<{ id: string }>;
        await runner.query(`UPDATE ${schema}.inventory_movements SET lot_id = $2 WHERE id = $1`, [
          movements[0]!.id,
          lots[0]!.id,
        ]);
      }
    }
    await runner.query(
      `UPDATE ${schema}.orders
       SET inventory_applied_at = NULL, updated_by_user_id = $2, updated_at = now()
       WHERE id = $1`,
      [order.id, userId],
    );
  }

  private async consumeOrderLots(
    runner: QueryRunner,
    schema: string,
    productId: string,
    movementId: string,
    requiredQuantity: number,
    description: string,
  ): Promise<InventoryCostResult> {
    const lots = (await runner.query(
      `SELECT id, remaining_quantity::text, unit_cost::text
       FROM ${schema}.inventory_lots
       WHERE product_id = $1 AND remaining_quantity > 0
       ORDER BY received_at, id FOR UPDATE`,
      [productId],
    )) as InventoryLotRow[];
    let pending = requiredQuantity;
    for (const lot of lots) {
      if (pending <= 0) break;
      const consumed = Math.min(pending, Number(lot.remaining_quantity));
      await runner.query(
        `UPDATE ${schema}.inventory_lots
         SET remaining_quantity = remaining_quantity - $2 WHERE id = $1`,
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
        `No hay lotes suficientes para terminar la orden: ${description}`,
      );
    }
    const cost = await this.allocationCost(runner, schema, movementId);
    if (!cost) throw new Error('No se pudo calcular el costo real del inventario');
    await runner.query(`UPDATE ${schema}.inventory_movements SET unit_cost = $2 WHERE id = $1`, [
      movementId,
      cost.unitCost,
    ]);
    return cost;
  }

  private async allocationCost(
    runner: QueryRunner,
    schema: string,
    movementId: string | undefined,
  ): Promise<InventoryCostResult | undefined> {
    if (!movementId) return undefined;
    const rows = (await runner.query(
      `SELECT round(sum(quantity * unit_cost) / nullif(sum(quantity), 0), 2)::text AS unit_cost,
              round(sum(quantity * unit_cost), 2)::text AS total_cost
       FROM ${schema}.inventory_lot_allocations WHERE movement_id = $1`,
      [movementId],
    )) as Array<{ unit_cost: string | null; total_cost: string | null }>;
    const cost = rows[0];
    if (!cost?.unit_cost || !cost.total_cost) return undefined;
    return { unitCost: cost.unit_cost, totalCost: cost.total_cost };
  }

  private async inventoryItems(
    runner: QueryRunner,
    schema: string,
    orderId: string,
  ): Promise<InventoryOrderItemRow[]> {
    return (await runner.query(
      `SELECT id, product_service_id, description, quantity, unit_cost
       FROM ${schema}.order_items
       WHERE order_id = $1 AND kind = 'product'
         AND product_service_id IS NOT NULL AND tracks_inventory = true
       ORDER BY product_service_id, position FOR UPDATE`,
      [orderId],
    )) as InventoryOrderItemRow[];
  }

  private orderSelect(schema: string): string {
    return `SELECT service_order.id, service_order.folio::text AS folio,
      service_order.external_folio,
      service_order.customer_id, customer.customer_type, customer.display_name AS customer_name,
      service_order.vehicle_id, brand.name AS brand_name, model.name AS model_name,
      vehicle.model_year, vehicle.color, vehicle.serial_number, vehicle.license_plate,
      service_order.status, service_order.subtotal, service_order.total,
      service_order.total_cost, service_order.gross_profit, service_order.inventory_applied_at,
      service_order.is_paid, service_order.paid_at,
      EXISTS(
        SELECT 1 FROM ${schema}.order_items unpriced
        WHERE unpriced.order_id = service_order.id
          AND unpriced.affects_order_total = true
          AND unpriced.unit_price IS NULL
      ) AS has_unpriced_items,
      EXISTS(
        SELECT 1 FROM ${schema}.order_items unknown_cost
        WHERE unknown_cost.order_id = service_order.id
          AND ${unknownOrderItemCostSql('unknown_cost')}
      ) AS has_unknown_costs,
      (SELECT COUNT(*)::text FROM ${schema}.order_items counted
       WHERE counted.order_id = service_order.id) AS item_count,
      service_order.opened_at, service_order.closed_at,
      service_order.created_by_user_id, service_order.updated_by_user_id,
      service_order.created_at, service_order.updated_at
      FROM ${schema}.orders service_order
      JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
      JOIN ${schema}.vehicles vehicle ON vehicle.id = service_order.vehicle_id
      JOIN public.vehicle_brands brand ON brand.id = vehicle.brand_id
      JOIN public.vehicle_models model ON model.id = vehicle.model_id`;
  }

  private toBaseResponse(row: OrderRow): OrderSummaryResponseDto {
    return {
      id: row.id,
      folio: row.folio,
      externalFolio: row.external_folio,
      status: row.status,
      customer: {
        id: row.customer_id,
        type: row.customer_type,
        displayName: row.customer_name,
      },
      vehicle: {
        id: row.vehicle_id,
        brandName: row.brand_name,
        modelName: row.model_name,
        year: row.model_year,
        color: row.color,
        numeroSerie: row.serial_number,
        licensePlate: row.license_plate,
      },
      subtotal: row.subtotal,
      total: row.total,
      totalCost: row.total_cost,
      grossProfit: row.gross_profit,
      inventoryAppliedAt: row.inventory_applied_at,
      hasUnpricedItems: row.has_unpriced_items,
      hasUnknownCosts: row.has_unknown_costs,
      isFinanciallyComplete: !row.has_unpriced_items && !row.has_unknown_costs,
      isPaid: row.is_paid,
      paidAt: row.paid_at,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      createdByUserId: row.created_by_user_id,
      updatedByUserId: row.updated_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toListResponse(row: OrderRow): OrderListItemResponseDto {
    return {
      ...this.toBaseResponse(row),
      itemCount: Number(row.item_count),
    };
  }
}
