import { ForbiddenException, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  DashboardFinancialsResponseDto,
  DashboardLowStockProductResponseDto,
  DashboardLowStockResponseDto,
  DashboardSummaryResponseDto,
} from './dto/dashboard.dto';

interface OperationsRow {
  month: string;
  starts_on: string;
  ends_on: string;
  in_progress_count: number;
  completed_unpaid_count: number;
  completed_paid_count: number;
  generated: string;
  collected: string;
  outstanding: string;
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

@Injectable()
export class DashboardService {
  constructor(private readonly tenant: TenantSessionService) {}

  summary(user: AuthenticatedUser): Promise<DashboardSummaryResponseDto> {
    const subscription = user.subscription;
    if (!subscription) throw new ForbiddenException('Se requiere una suscripción de compañía');
    const includesFinancials = subscription.features.includes('profitability');
    const includesLowStock = subscription.features.includes('inventory');
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const operations = await this.operations(runner, schema);
      const financials = includesFinancials
        ? await this.financials(runner, schema)
        : null;
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
          completedUnpaidCount: operations.completed_unpaid_count,
          completedPaidCount: operations.completed_paid_count,
        },
        revenue: {
          generated: operations.generated,
          collected: operations.collected,
          outstanding: operations.outstanding,
        },
        financials,
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
         ), 0)::numeric(14,2)::text AS outstanding
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

  private async lowStock(runner: QueryRunner, schema: string): Promise<DashboardLowStockResponseDto> {
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
}
