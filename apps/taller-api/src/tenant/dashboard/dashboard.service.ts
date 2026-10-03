import { ForbiddenException, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { PermissionsService } from '../../permissions/permissions.service';
import { TenantSessionService } from '../tenant-session.service';
import {
  DashboardActivityResponseDto,
  DashboardExpenseActivityResponseDto,
  DashboardFinancialsResponseDto,
  DashboardInventoryMovementActivityResponseDto,
  DashboardLowStockProductResponseDto,
  DashboardLowStockResponseDto,
  DashboardOldOrderResponseDto,
  DashboardOrderActivityResponseDto,
  DashboardPurchaseActivityResponseDto,
  DashboardReceivableResponseDto,
  DashboardSummaryResponseDto,
} from './dto/dashboard.dto';

interface OperationsRow {
  month: string;
  starts_on: string;
  ends_on: string;
  in_progress_count: number;
  unpaid_count: number;
  completed_unpaid_count: number;
  completed_paid_count: number;
  generated: string;
  collected: string;
  outstanding: string;
  receivable: string;
}

interface FinancialsRow {
  direct_cost: string;
  gross_profit: string;
  operating_expenses: string;
  operating_profit: string;
  incomplete_order_count: number;
}

interface LowStockRow {
  id: string;
  sku: string | null;
  name: string;
  unit_symbol: string;
  stock: string;
  minimum_stock: string;
  total_count: number;
}

interface OrderActivityRow {
  id: string;
  folio: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string;
  brand_name: string;
  model_name: string;
  status: string;
  is_paid: boolean;
  total: string | null;
  opened_at: Date;
  closed_at: Date | null;
  updated_at: Date;
  days_open?: number;
}

interface PurchaseActivityRow {
  id: string;
  folio: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  total: string;
  item_count: number;
  purchased_at: Date;
  updated_at: Date;
}

interface ExpenseActivityRow {
  id: string;
  description: string;
  category_name: string;
  supplier_name: string;
  status: string;
  amount: string;
  occurred_on: string;
  updated_at: Date;
}

interface InventoryMovementActivityRow {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  movement_type: string;
  quantity: string;
  resulting_stock: string;
  reason: string;
  created_at: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly tenant: TenantSessionService,
    private readonly permissions: PermissionsService,
  ) {}

  summary(user: AuthenticatedUser): Promise<DashboardSummaryResponseDto> {
    const subscription = user.subscription;
    if (!subscription) throw new ForbiddenException('Se requiere una suscripción de compañía');
    const includesFinancials =
      subscription.features.includes('profitability') &&
      this.permissions.has(user, 'profitability.view');
    const includesLowStock =
      subscription.features.includes('inventory') && this.permissions.has(user, 'inventory.view');
    const includesRevenue =
      this.permissions.has(user, 'orders.manage_payment') || includesFinancials;
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const operations = await this.operations(runner, schema);
      const financials = includesFinancials ? await this.financials(runner, schema) : null;
      const lowStock = includesLowStock ? await this.lowStock(runner, schema) : null;
      return {
        period: {
          month: operations.month,
          startsOn: operations.starts_on,
          endsOn: operations.ends_on,
        },
        access: {
          planCode: subscription.planCode,
          planName: subscription.planName,
          includesFinancials,
          includesLowStock,
        },
        orders: {
          inProgressCount: operations.in_progress_count,
          unpaidCount: operations.unpaid_count,
          completedUnpaidCount: operations.completed_unpaid_count,
          completedPaidCount: operations.completed_paid_count,
        },
        revenue: {
          generated: includesRevenue ? operations.generated : '0.00',
          collected: includesRevenue ? operations.collected : '0.00',
          outstanding: includesRevenue ? operations.outstanding : '0.00',
          receivable: includesRevenue ? operations.receivable : '0.00',
        },
        financials,
        lowStock,
      };
    });
  }

  activity(user: AuthenticatedUser): Promise<DashboardActivityResponseDto> {
    const subscription = user.subscription;
    if (!subscription) throw new ForbiddenException('Se requiere una suscripción de compañía');
    const includesOrders = this.permissions.has(user, 'orders.view');
    const includesCollections = this.permissions.has(user, 'orders.manage_payment');
    const includesPurchases =
      subscription.features.includes('inventory') &&
      this.permissions.has(user, 'purchases.view') &&
      this.permissions.has(user, 'catalog.view_costs');
    const includesInventory =
      subscription.features.includes('inventory') && this.permissions.has(user, 'inventory.view');
    const includesExpenses =
      subscription.features.includes('expenses') && this.permissions.has(user, 'expenses.view');
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const recentOrders = includesOrders ? await this.recentOrders(runner, schema) : [];
      const oldestInProgress = includesOrders ? await this.oldestInProgress(runner, schema) : [];
      const pendingCollection = includesCollections
        ? await this.pendingCollection(runner, schema)
        : [];
      const recentPurchases = includesPurchases ? await this.recentPurchases(runner, schema) : null;
      const recentExpenses = includesExpenses ? await this.recentExpenses(runner, schema) : null;
      const recentInventoryMovements = includesInventory
        ? await this.recentInventoryMovements(runner, schema)
        : null;
      const lowStock = includesInventory ? await this.lowStock(runner, schema) : null;
      return {
        recentOrders,
        oldestInProgress,
        pendingCollection,
        recentPurchases,
        recentExpenses,
        recentInventoryMovements,
        lowStock,
      };
    });
  }

  private async operations(runner: QueryRunner, schema: string): Promise<OperationsRow> {
    const rows = (await runner.query(
      `WITH period AS (
         SELECT date_trunc('month', current_date)::date AS starts_on,
           (date_trunc('month', current_date) + interval '1 month - 1 day')::date AS ends_on
       )
       SELECT to_char(period.starts_on, 'YYYY-MM') AS month,
         period.starts_on::text, period.ends_on::text,
         count(*) FILTER (WHERE service_order.status = 'in_progress')::int AS in_progress_count,
         count(*) FILTER (
           WHERE service_order.status <> 'cancelled' AND service_order.is_paid = false
         )::int AS unpaid_count,
         count(*) FILTER (
           WHERE service_order.status = 'completed' AND service_order.is_paid = false
         )::int AS completed_unpaid_count,
         count(*) FILTER (
           WHERE service_order.status = 'completed' AND service_order.is_paid = true
         )::int AS completed_paid_count,
         COALESCE(sum(service_order.total) FILTER (
           WHERE service_order.status = 'completed'
             AND service_order.closed_at >= period.starts_on
             AND service_order.closed_at < period.starts_on + interval '1 month'
         ), 0)::numeric(14,2)::text AS generated,
         COALESCE(sum(service_order.total) FILTER (
           WHERE service_order.status = 'completed' AND service_order.is_paid = true
             AND service_order.closed_at >= period.starts_on
             AND service_order.closed_at < period.starts_on + interval '1 month'
         ), 0)::numeric(14,2)::text AS collected,
         COALESCE(sum(service_order.total) FILTER (
           WHERE service_order.status = 'completed' AND service_order.is_paid = false
             AND service_order.closed_at >= period.starts_on
             AND service_order.closed_at < period.starts_on + interval '1 month'
         ), 0)::numeric(14,2)::text AS outstanding,
         COALESCE(sum(service_order.total) FILTER (
           WHERE service_order.status <> 'cancelled' AND service_order.is_paid = false
         ), 0)::numeric(14,2)::text AS receivable
       FROM period LEFT JOIN ${schema}.orders service_order ON true
       GROUP BY period.starts_on, period.ends_on`,
    )) as OperationsRow[];
    return rows[0]!;
  }

  private async financials(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardFinancialsResponseDto> {
    const rows = (await runner.query(
      `WITH period AS (
         SELECT date_trunc('month', current_date)::date AS starts_on
       ), order_totals AS (
         SELECT COALESCE(sum(service_order.total_cost), 0) AS direct_cost,
           COALESCE(sum(service_order.gross_profit), 0) AS gross_profit,
           count(*) FILTER (
             WHERE service_order.total IS NULL OR service_order.total_cost IS NULL
               OR service_order.gross_profit IS NULL
           )::int AS incomplete_order_count
         FROM period JOIN ${schema}.orders service_order
           ON service_order.status = 'completed'
          AND service_order.closed_at >= period.starts_on
          AND service_order.closed_at < period.starts_on + interval '1 month'
       ), expense_totals AS (
         SELECT COALESCE(sum(expense.amount), 0) AS operating_expenses
         FROM period JOIN ${schema}.expenses expense
           ON expense.status = 'confirmed'
          AND expense.occurred_on >= period.starts_on
          AND expense.occurred_on < period.starts_on + interval '1 month'
       )
       SELECT order_totals.direct_cost::numeric(14,2)::text AS direct_cost,
         order_totals.gross_profit::numeric(14,2)::text AS gross_profit,
         expense_totals.operating_expenses::numeric(14,2)::text AS operating_expenses,
         (order_totals.gross_profit - expense_totals.operating_expenses)
           ::numeric(14,2)::text AS operating_profit,
         order_totals.incomplete_order_count
       FROM order_totals CROSS JOIN expense_totals`,
    )) as FinancialsRow[];
    const row = rows[0]!;
    return {
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
      operatingExpenses: row.operating_expenses,
      operatingProfit: row.operating_profit,
      incompleteOrderCount: row.incomplete_order_count,
      isComplete: row.incomplete_order_count === 0,
    };
  }

  private async lowStock(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardLowStockResponseDto> {
    const rows = (await runner.query(
      `SELECT concept.id, concept.sku, concept.name, unit.symbol AS unit_symbol,
         concept.stock::text, concept.minimum_stock::text,
         count(*) OVER()::int AS total_count
       FROM ${schema}.products_services concept
       JOIN ${schema}.measurement_units unit ON unit.id = concept.unit_id
       WHERE concept.kind = 'product' AND concept.tracks_inventory = true
         AND concept.is_active = true AND concept.minimum_stock > 0
         AND concept.stock <= concept.minimum_stock
       ORDER BY concept.stock - concept.minimum_stock, concept.name, concept.id
       LIMIT 5`,
    )) as LowStockRow[];
    return {
      totalProducts: rows[0]?.total_count ?? 0,
      products: rows.map<DashboardLowStockProductResponseDto>((row) => ({
        id: row.id,
        sku: row.sku,
        name: row.name,
        unitSymbol: row.unit_symbol,
        stock: row.stock,
        minimumStock: row.minimum_stock,
      })),
    };
  }

  private async recentOrders(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardOrderActivityResponseDto[]> {
    const rows = (await runner.query(
      `${this.orderActivitySelect(schema)}
       ORDER BY service_order.updated_at DESC, service_order.id DESC LIMIT 5`,
    )) as OrderActivityRow[];
    return rows.map((row) => this.toOrderActivity(row));
  }

  private async oldestInProgress(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardOldOrderResponseDto[]> {
    const rows = (await runner.query(
      `${this.orderActivitySelect(schema)}
       WHERE service_order.status = 'in_progress'
       ORDER BY service_order.opened_at, service_order.id LIMIT 5`,
    )) as OrderActivityRow[];
    return rows.map((row) => ({
      ...this.toOrderActivity(row),
      openedAt: row.opened_at,
      daysOpen: row.days_open ?? 0,
    }));
  }

  private async pendingCollection(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardReceivableResponseDto[]> {
    const rows = (await runner.query(
      `${this.orderActivitySelect(schema)}
       WHERE service_order.status <> 'cancelled' AND service_order.is_paid = false
       ORDER BY COALESCE(service_order.closed_at, service_order.opened_at),
         service_order.total DESC NULLS LAST, service_order.id
       LIMIT 5`,
    )) as OrderActivityRow[];
    return rows.map((row) => ({
      id: row.id,
      folio: row.folio,
      customerId: row.customer_id,
      customerName: row.customer_name,
      vehicleId: row.vehicle_id,
      brandName: row.brand_name,
      modelName: row.model_name,
      status: row.status,
      total: row.total,
      openedAt: row.opened_at,
      completedAt: row.closed_at,
    }));
  }

  private async recentPurchases(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardPurchaseActivityResponseDto[]> {
    const rows = (await runner.query(
      `SELECT purchase.id, purchase.folio::text, purchase.supplier_id,
         supplier.name AS supplier_name, purchase.status, purchase.total::text,
         (SELECT count(*)::int FROM ${schema}.purchase_items item
          WHERE item.purchase_id = purchase.id) AS item_count,
         purchase.purchased_at, purchase.updated_at
       FROM ${schema}.purchases purchase
       JOIN ${schema}.suppliers supplier ON supplier.id = purchase.supplier_id
       ORDER BY purchase.updated_at DESC, purchase.id DESC LIMIT 5`,
    )) as PurchaseActivityRow[];
    return rows.map((row) => ({
      id: row.id,
      folio: row.folio,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      status: row.status,
      total: row.total,
      itemCount: row.item_count,
      purchasedAt: row.purchased_at,
      updatedAt: row.updated_at,
    }));
  }

  private async recentExpenses(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardExpenseActivityResponseDto[]> {
    const rows = (await runner.query(
      `SELECT expense.id, expense.description, category.name AS category_name,
         supplier.name AS supplier_name, expense.status, expense.amount::text,
         expense.occurred_on::text, expense.updated_at
       FROM ${schema}.expenses expense
       JOIN ${schema}.expense_categories category ON category.id = expense.category_id
       JOIN ${schema}.suppliers supplier ON supplier.id = expense.supplier_id
       ORDER BY expense.updated_at DESC, expense.id DESC LIMIT 5`,
    )) as ExpenseActivityRow[];
    return rows.map((row) => ({
      id: row.id,
      description: row.description,
      categoryName: row.category_name,
      supplierName: row.supplier_name,
      status: row.status,
      amount: row.amount,
      occurredOn: row.occurred_on,
      updatedAt: row.updated_at,
    }));
  }

  private async recentInventoryMovements(
    runner: QueryRunner,
    schema: string,
  ): Promise<DashboardInventoryMovementActivityResponseDto[]> {
    const rows = (await runner.query(
      `SELECT movement.id, movement.product_id, concept.name AS product_name,
         concept.sku AS product_sku, movement.movement_type, movement.quantity::text,
         movement.resulting_stock::text, movement.reason, movement.created_at
       FROM ${schema}.inventory_movements movement
       JOIN ${schema}.products_services concept ON concept.id = movement.product_id
       ORDER BY movement.created_at DESC, movement.id DESC LIMIT 5`,
    )) as InventoryMovementActivityRow[];
    return rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      productSku: row.product_sku,
      type: row.movement_type,
      quantity: row.quantity,
      resultingStock: row.resulting_stock,
      reason: row.reason,
      createdAt: row.created_at,
    }));
  }

  private orderActivitySelect(schema: string): string {
    return `SELECT service_order.id, service_order.folio::text,
      service_order.customer_id, customer.display_name AS customer_name,
      service_order.vehicle_id, brand.name AS brand_name, model.name AS model_name,
      service_order.status, service_order.is_paid, service_order.total::text,
      service_order.opened_at, service_order.closed_at, service_order.updated_at,
      GREATEST(0, current_date - service_order.opened_at::date)::int AS days_open
      FROM ${schema}.orders service_order
      JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
      JOIN ${schema}.vehicles vehicle ON vehicle.id = service_order.vehicle_id
      JOIN public.vehicle_brands brand ON brand.id = vehicle.brand_id
      JOIN public.vehicle_models model ON model.id = vehicle.model_id`;
  }

  private toOrderActivity(row: OrderActivityRow): DashboardOrderActivityResponseDto {
    return {
      id: row.id,
      folio: row.folio,
      customerId: row.customer_id,
      customerName: row.customer_name,
      vehicleId: row.vehicle_id,
      brandName: row.brand_name,
      modelName: row.model_name,
      status: row.status,
      isPaid: row.is_paid,
      total: row.total,
      updatedAt: row.updated_at,
    };
  }
}
