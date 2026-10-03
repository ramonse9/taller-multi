import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  ProfitabilityCustomerRowResponseDto,
  ProfitabilityOrderRowResponseDto,
  ProfitabilityPeriodRowResponseDto,
  ProfitabilityQueryDto,
  ProfitabilityReportResponseDto,
  ProfitabilityServiceTypeRowResponseDto,
} from './dto/profitability.dto';

interface TotalsRow {
  occurred_from: string;
  occurred_to: string;
  completed_order_count: number;
  incomplete_order_count: number;
  income: string;
  direct_cost: string;
  fifo_product_cost: string;
  gross_profit: string;
  operating_expenses: string;
  net_profit: string;
  gross_margin_percent: string | null;
  net_margin_percent: string | null;
}

interface PeriodRow {
  period: string;
  completed_order_count: number;
  income: string;
  direct_cost: string;
  gross_profit: string;
  operating_expenses: string;
  net_profit: string;
}

interface CustomerRow {
  customer_id: string;
  customer_name: string;
  customer_type: 'person' | 'company';
  completed_order_count: number;
  income: string;
  direct_cost: string;
  gross_profit: string;
}

interface ServiceTypeRow {
  type: 'service' | 'product' | 'free';
  item_count: number;
  income: string;
  direct_cost: string;
  gross_profit: string;
}

interface OrderRow {
  id: string;
  folio: string;
  customer_id: string;
  customer_name: string;
  completed_at: Date;
  income: string | null;
  direct_cost: string | null;
  fifo_product_cost: string;
  gross_profit: string | null;
}

@Injectable()
export class ProfitabilityService {
  constructor(private readonly tenant: TenantSessionService) {}

  report(
    user: AuthenticatedUser,
    query: ProfitabilityQueryDto,
  ): Promise<ProfitabilityReportResponseDto> {
    if (query.occurredFrom && query.occurredTo && query.occurredFrom > query.occurredTo) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
    }
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const parameters = [query.occurredFrom ?? null, query.occurredTo ?? null];
      const bounds = `SELECT
        COALESCE($1::date, date_trunc('month', current_date)::date) AS from_date,
        COALESCE($2::date, current_date) AS to_date`;
      const totalsRows = (await runner.query(
        `WITH bounds AS (${bounds}), order_totals AS (
           SELECT count(*)::int AS completed_order_count,
             count(*) FILTER (
               WHERE service_order.total IS NULL OR service_order.total_cost IS NULL
                 OR service_order.gross_profit IS NULL
             )::int AS incomplete_order_count,
             COALESCE(sum(service_order.total) FILTER (WHERE service_order.total IS NOT NULL), 0)
               AS income,
             COALESCE(sum(service_order.total_cost) FILTER (
               WHERE service_order.total_cost IS NOT NULL
             ), 0) AS direct_cost,
             COALESCE(sum(service_order.gross_profit) FILTER (
               WHERE service_order.gross_profit IS NOT NULL
             ), 0) AS gross_profit
           FROM bounds LEFT JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
         ), fifo AS (
           SELECT COALESCE(sum(allocation.quantity * allocation.unit_cost), 0) AS fifo_product_cost
           FROM bounds
           JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
           JOIN ${schema}.inventory_movements movement
             ON movement.order_id = service_order.id AND movement.movement_type = 'exit'
            AND NOT EXISTS (
              SELECT 1 FROM ${schema}.inventory_movements reversal
              WHERE reversal.reverses_movement_id = movement.id
            )
           JOIN ${schema}.inventory_lot_allocations allocation
             ON allocation.movement_id = movement.id
         ), expense_totals AS (
           SELECT COALESCE(sum(expense.amount), 0) AS operating_expenses
           FROM bounds LEFT JOIN ${schema}.expenses expense
             ON expense.status = 'confirmed'
            AND expense.occurred_on BETWEEN bounds.from_date AND bounds.to_date
         )
         SELECT bounds.from_date::text AS occurred_from, bounds.to_date::text AS occurred_to,
           order_totals.completed_order_count, order_totals.incomplete_order_count,
           order_totals.income::numeric(14,2)::text AS income,
           order_totals.direct_cost::numeric(14,2)::text AS direct_cost,
           fifo.fifo_product_cost::numeric(14,2)::text AS fifo_product_cost,
           order_totals.gross_profit::numeric(14,2)::text AS gross_profit,
           expense_totals.operating_expenses::numeric(14,2)::text AS operating_expenses,
           (order_totals.gross_profit - expense_totals.operating_expenses)::numeric(14,2)::text
             AS net_profit,
           CASE WHEN order_totals.income = 0 THEN NULL ELSE
             round(order_totals.gross_profit / order_totals.income * 100, 2)::text
           END AS gross_margin_percent,
           CASE WHEN order_totals.income = 0 THEN NULL ELSE
             round((order_totals.gross_profit - expense_totals.operating_expenses)
               / order_totals.income * 100, 2)::text
           END AS net_margin_percent
         FROM bounds CROSS JOIN order_totals CROSS JOIN fifo CROSS JOIN expense_totals`,
        parameters,
      )) as TotalsRow[];
      const byDay = await this.periodRows(runner, schema, bounds, parameters, 'day');
      const byMonth = await this.periodRows(runner, schema, bounds, parameters, 'month');
      const customerRows = (await runner.query(
        `WITH bounds AS (${bounds})
         SELECT customer.id AS customer_id, customer.display_name AS customer_name,
           customer.customer_type, count(*)::int AS completed_order_count,
           COALESCE(sum(service_order.total), 0)::numeric(14,2)::text AS income,
           COALESCE(sum(service_order.total_cost), 0)::numeric(14,2)::text AS direct_cost,
           COALESCE(sum(service_order.gross_profit), 0)::numeric(14,2)::text AS gross_profit
         FROM bounds
         JOIN ${schema}.orders service_order
           ON service_order.status = 'completed'
          AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
         JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
         GROUP BY customer.id, customer.display_name, customer.customer_type
         ORDER BY sum(service_order.total) DESC NULLS LAST, customer.display_name`,
        parameters,
      )) as CustomerRow[];
      const serviceTypeRows = (await runner.query(
        `WITH bounds AS (${bounds}), typed AS (
           SELECT CASE WHEN item.product_service_id IS NULL THEN 'free'
             WHEN concept.kind = 'service' THEN 'service' ELSE 'product' END AS type,
             item.total, item.cost_total
           FROM bounds
           JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
           JOIN ${schema}.order_items item ON item.order_id = service_order.id
           LEFT JOIN ${schema}.products_services concept ON concept.id = item.product_service_id
         )
         SELECT type, count(*)::int AS item_count,
           COALESCE(sum(total), 0)::numeric(14,2)::text AS income,
           COALESCE(sum(cost_total), 0)::numeric(14,2)::text AS direct_cost,
           (COALESCE(sum(total), 0) - COALESCE(sum(cost_total), 0))::numeric(14,2)::text
             AS gross_profit
         FROM typed GROUP BY type ORDER BY sum(total) DESC NULLS LAST, type`,
        parameters,
      )) as ServiceTypeRow[];
      const orderRows = (await runner.query(
        `WITH bounds AS (${bounds}), fifo AS (
           SELECT movement.order_id,
             sum(allocation.quantity * allocation.unit_cost) AS fifo_product_cost
           FROM ${schema}.inventory_movements movement
           JOIN ${schema}.inventory_lot_allocations allocation
             ON allocation.movement_id = movement.id
           WHERE movement.movement_type = 'exit'
             AND NOT EXISTS (
               SELECT 1 FROM ${schema}.inventory_movements reversal
               WHERE reversal.reverses_movement_id = movement.id
             )
           GROUP BY movement.order_id
         )
         SELECT service_order.id, service_order.folio::text, customer.id AS customer_id,
           customer.display_name AS customer_name, service_order.closed_at AS completed_at,
           service_order.total::text AS income, service_order.total_cost::text AS direct_cost,
           COALESCE(fifo.fifo_product_cost, 0)::numeric(14,2)::text AS fifo_product_cost,
           service_order.gross_profit::text AS gross_profit
         FROM bounds
         JOIN ${schema}.orders service_order
           ON service_order.status = 'completed'
          AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
         JOIN ${schema}.customers customer ON customer.id = service_order.customer_id
         LEFT JOIN fifo ON fifo.order_id = service_order.id
         ORDER BY service_order.closed_at DESC, service_order.folio DESC`,
        parameters,
      )) as OrderRow[];
      const totals = totalsRows[0]!;
      return {
        occurredFrom: totals.occurred_from,
        occurredTo: totals.occurred_to,
        totals: {
          completedOrderCount: totals.completed_order_count,
          incompleteOrderCount: totals.incomplete_order_count,
          income: totals.income,
          directCost: totals.direct_cost,
          fifoProductCost: totals.fifo_product_cost,
          grossProfit: totals.gross_profit,
          operatingExpenses: totals.operating_expenses,
          netProfit: totals.net_profit,
          grossMarginPercent: totals.gross_margin_percent,
          netMarginPercent: totals.net_margin_percent,
          isComplete: totals.incomplete_order_count === 0,
        },
        byDay,
        byMonth,
        byCustomer: customerRows.map((row) => this.toCustomer(row)),
        byServiceType: serviceTypeRows.map((row) => this.toServiceType(row)),
        orders: orderRows.map((row) => this.toOrder(row)),
      };
    });
  }

  private async periodRows(
    runner: import('typeorm').QueryRunner,
    schema: string,
    bounds: string,
    parameters: Array<string | null>,
    granularity: 'day' | 'month',
  ): Promise<ProfitabilityPeriodRowResponseDto[]> {
    const format = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const rows = (await runner.query(
      `WITH bounds AS (${bounds}), order_period AS (
         SELECT date_trunc('${granularity}', service_order.closed_at)::date AS period,
           count(*)::int AS completed_order_count,
           COALESCE(sum(service_order.total), 0) AS income,
           COALESCE(sum(service_order.total_cost), 0) AS direct_cost,
           COALESCE(sum(service_order.gross_profit), 0) AS gross_profit
         FROM bounds JOIN ${schema}.orders service_order
           ON service_order.status = 'completed'
          AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
         GROUP BY date_trunc('${granularity}', service_order.closed_at)::date
       ), expense_period AS (
         SELECT date_trunc('${granularity}', expense.occurred_on)::date AS period,
           COALESCE(sum(expense.amount), 0) AS operating_expenses
         FROM bounds JOIN ${schema}.expenses expense
           ON expense.status = 'confirmed'
          AND expense.occurred_on BETWEEN bounds.from_date AND bounds.to_date
         GROUP BY date_trunc('${granularity}', expense.occurred_on)::date
       )
       SELECT to_char(COALESCE(order_period.period, expense_period.period), '${format}') AS period,
         COALESCE(order_period.completed_order_count, 0)::int AS completed_order_count,
         COALESCE(order_period.income, 0)::numeric(14,2)::text AS income,
         COALESCE(order_period.direct_cost, 0)::numeric(14,2)::text AS direct_cost,
         COALESCE(order_period.gross_profit, 0)::numeric(14,2)::text AS gross_profit,
         COALESCE(expense_period.operating_expenses, 0)::numeric(14,2)::text
           AS operating_expenses,
         (COALESCE(order_period.gross_profit, 0)
           - COALESCE(expense_period.operating_expenses, 0))::numeric(14,2)::text AS net_profit
       FROM order_period FULL JOIN expense_period USING (period)
       ORDER BY COALESCE(order_period.period, expense_period.period)`,
      parameters,
    )) as PeriodRow[];
    return rows.map((row) => ({
      period: row.period,
      completedOrderCount: row.completed_order_count,
      income: row.income,
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
      operatingExpenses: row.operating_expenses,
      netProfit: row.net_profit,
    }));
  }

  private toCustomer(row: CustomerRow): ProfitabilityCustomerRowResponseDto {
    return {
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerType: row.customer_type,
      completedOrderCount: row.completed_order_count,
      income: row.income,
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
    };
  }

  private toServiceType(row: ServiceTypeRow): ProfitabilityServiceTypeRowResponseDto {
    const names = { service: 'Servicios de catálogo', product: 'Productos', free: 'Conceptos libres' };
    return {
      type: row.type,
      name: names[row.type],
      itemCount: row.item_count,
      income: row.income,
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
    };
  }

  private toOrder(row: OrderRow): ProfitabilityOrderRowResponseDto {
    return {
      id: row.id,
      folio: row.folio,
      customerId: row.customer_id,
      customerName: row.customer_name,
      completedAt: row.completed_at,
      income: row.income,
      directCost: row.direct_cost,
      fifoProductCost: row.fifo_product_cost,
      grossProfit: row.gross_profit,
      isComplete: row.income !== null && row.direct_cost !== null && row.gross_profit !== null,
    };
  }
}
