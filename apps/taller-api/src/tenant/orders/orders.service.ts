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
  CreateOrderDto,
  CreateOrderNoteDto,
  OrderItemInputDto,
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

interface OrderRow {
  id: string;
  folio: string;
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
  has_unpriced_items: boolean;
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
  customer_id: string;
  vehicle_id: string;
  status: OrderStatus;
}

interface OrderItemRow {
  id: string;
  position: number;
  description: string;
  quantity: string;
  unit_price: string | null;
  total: string | null;
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
      ];
      const where = `($1::text IS NULL OR service_order.status = $1)
        AND ($2::uuid IS NULL OR service_order.customer_id = $2)
        AND ($3::uuid IS NULL OR service_order.vehicle_id = $3)
        AND ($4 = '%%' OR service_order.folio::text ILIKE $4 ESCAPE '\\'
          OR customer.display_name ILIKE $4 ESCAPE '\\'
          OR COALESCE(vehicle.license_plate, '') ILIKE $4 ESCAPE '\\'
          OR COALESCE(vehicle.serial_number, '') ILIKE $4 ESCAPE '\\'
          OR brand.name ILIKE $4 ESCAPE '\\'
          OR model.name ILIKE $4 ESCAPE '\\')`;
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
         ORDER BY service_order.created_at DESC, service_order.id DESC LIMIT $5 OFFSET $6`,
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
      const rows = (await runner.query(
        `INSERT INTO ${schema}.orders(
           customer_id, vehicle_id, status, subtotal, tax, total,
           created_by_user_id, updated_by_user_id
         ) VALUES ($1, $2, 'in_progress', NULL, 0, NULL, $3, $3) RETURNING id`,
        [input.customerId, input.vehicleId, user.id],
      )) as Array<{ id: string }>;
      const orderId = rows[0]?.id;
      if (!orderId) throw new Error('No se pudo crear la orden');
      await this.replaceItems(runner, schema, orderId, input.items);
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
      if (
        input.customerId === undefined &&
        input.vehicleId === undefined &&
        input.items === undefined
      ) {
        throw new BadRequestException('No hay cambios para aplicar');
      }
      const customerId = input.customerId ?? order.customer_id;
      const vehicleId = input.vehicleId ?? order.vehicle_id;
      await this.validateCustomerVehicle(runner, schema, customerId, vehicleId);
      if (input.customerId !== undefined || input.vehicleId !== undefined) {
        await runner.query(
          `UPDATE ${schema}.orders
           SET customer_id = $1, vehicle_id = $2, updated_by_user_id = $3, updated_at = now()
           WHERE id = $4`,
          [customerId, vehicleId, user.id, id],
        );
      }
      if (input.items !== undefined) {
        await this.replaceItems(runner, schema, id, input.items);
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
      `SELECT id, position, description, quantity, unit_price, total
       FROM ${schema}.order_items WHERE order_id = $1 ORDER BY position`,
      [id],
    )) as OrderItemRow[];
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
        position: item.position,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.total,
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
  ): Promise<void> {
    await runner.query(`DELETE FROM ${schema}.order_items WHERE order_id = $1`, [orderId]);
    for (const [index, item] of items.entries()) {
      const unitPrice = item.unitPrice ?? null;
      const amount = unitPrice === null ? null : this.amount(item.quantity, unitPrice);
      await runner.query(
        `INSERT INTO ${schema}.order_items(
           order_id, product_service_id, description, quantity, unit_price, total, position
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.description,
          item.quantity.toFixed(3),
          unitPrice === null ? null : unitPrice.toFixed(2),
          amount,
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
           updated_by_user_id = $2, updated_at = now()
       FROM (
         SELECT CASE
           WHEN COUNT(*) FILTER (WHERE total IS NULL) > 0 THEN NULL
           ELSE COALESCE(SUM(total), 0)
         END AS total
         FROM ${schema}.order_items WHERE order_id = $1
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
      `SELECT id, customer_id, vehicle_id, status
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

  private orderSelect(schema: string): string {
    return `SELECT service_order.id, service_order.folio::text AS folio,
      service_order.customer_id, customer.customer_type, customer.display_name AS customer_name,
      service_order.vehicle_id, brand.name AS brand_name, model.name AS model_name,
      vehicle.model_year, vehicle.color, vehicle.serial_number, vehicle.license_plate,
      service_order.status, service_order.subtotal, service_order.total,
      EXISTS(
        SELECT 1 FROM ${schema}.order_items unpriced
        WHERE unpriced.order_id = service_order.id AND unpriced.unit_price IS NULL
      ) AS has_unpriced_items,
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
      hasUnpricedItems: row.has_unpriced_items,
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
