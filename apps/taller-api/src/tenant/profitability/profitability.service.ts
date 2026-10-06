import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import { unknownOrderItemCostSql } from '../orders/order-cost-rules';
import {
  ProfitabilityAnalyticsMonthResponseDto,
  ProfitabilityAnalyticsQueryDto,
  ProfitabilityAnalyticsResponseDto,
  ProfitabilityCustomerRowResponseDto,
  ProfitabilityOrderRowResponseDto,
  ProfitabilityPeriodRowResponseDto,
  ProfitabilityQueryDto,
  ProfitabilityReportResponseDto,
  ProfitabilityServiceTypeRowResponseDto,
} from './dto/profitability.dto';

interface AnalyticsMonthRow {
  period: string;
  starts_on: string;
  ends_on: string;
  completed_order_count: number;
  incomplete_order_count: number;
  generated_income: string;
  generated_direct_cost: string;
  generated_gross_profit: string;
  operating_expenses: string;
  generated_net_profit: string;
  generated_net_margin_percent: string | null;
  collected_order_count: number;
  collected_income: string;
  collected_direct_cost: string;
  collected_gross_profit: string;
  collected_net_result: string;
}

interface CollectionBreakdownRow {
  paid_order_count: number;
  paid_amount: string;
  pending_order_count: number;
  pending_amount: string;
}

interface ExpenseCategoryAnalyticsRow {
  category_id: string;
  category_code: string;
  category_name: string;
  expense_count: number;
  amount: string;
  percentage: string | null;
}

interface TotalsRow {
  occurred_from: string;
  occurred_to: string;
  completed_order_count: number;
  incomplete_order_count: number;
  missing_price_order_count: number;
  missing_cost_order_count: number;
  paid_completed_order_count: number;
  unpaid_completed_order_count: number;
  receivable_order_count: number;
  income: string;
  collected_income: string;
  outstanding_income: string;
  receivable_amount: string;
  direct_cost: string;
  fifo_product_cost: string;
  gross_profit: string;
  collected_gross_profit: string;
  operating_expenses: string;
  net_profit: string;
  collected_net_result: string;
  gross_margin_percent: string | null;
  net_margin_percent: string | null;
}

interface PeriodRow {
  period: string;
  completed_order_count: number;
  income: string;
  collected_income: string;
  outstanding_income: string;
  direct_cost: string;
  gross_profit: string;
  operating_expenses: string;
  net_profit: string;
  collected_net_result: string;
}

interface CustomerRow {
  customer_id: string;
  customer_name: string;
  customer_type: 'person' | 'company';
  completed_order_count: number;
  income: string;
  collected_income: string;
  outstanding_income: string;
  direct_cost: string;
  gross_profit: string;
}

interface ServiceTypeRow {
  type: 'service' | 'product';
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
  is_complete: boolean;
  is_paid: boolean;
}

@Injectable()
export class ProfitabilityService {
  constructor(private readonly tenant: TenantSessionService) {}

  analytics(
    user: AuthenticatedUser,
    query: ProfitabilityAnalyticsQueryDto,
  ): Promise<ProfitabilityAnalyticsResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const endingMonth = query.endingMonth ? `${query.endingMonth}-01` : null;
      const parameters = [query.months, endingMonth];
      const bounds = `SELECT
        COALESCE($2::date, date_trunc('month', current_date)::date) AS focus_start,
        (COALESCE($2::date, date_trunc('month', current_date)::date)
          - (($1::int - 1) * interval '1 month'))::date AS range_start,
        (COALESCE($2::date, date_trunc('month', current_date)::date)
          + interval '1 month')::date AS focus_end`;

      const monthRows = (await runner.query(
        `WITH bounds AS (${bounds}), months AS (
           SELECT generate_series(bounds.range_start, bounds.focus_start, interval '1 month')::date
             AS starts_on
           FROM bounds
         ), generated AS (
           SELECT date_trunc('month', service_order.closed_at)::date AS starts_on,
             count(*)::int AS completed_order_count,
             count(*) FILTER (WHERE EXISTS (
               SELECT 1 FROM ${schema}.order_items item
               WHERE item.order_id = service_order.id
                 AND ((item.affects_order_total AND item.unit_price IS NULL)
                   OR (${unknownOrderItemCostSql('item')}))
             ))::int AS incomplete_order_count,
             COALESCE(sum(service_order.total), 0) AS income,
             COALESCE(sum(service_order.total_cost), 0) AS direct_cost,
             COALESCE(sum(service_order.gross_profit), 0) AS gross_profit
           FROM bounds JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at >= bounds.range_start
            AND service_order.closed_at < bounds.focus_end
           GROUP BY date_trunc('month', service_order.closed_at)::date
         ), collected AS (
           SELECT date_trunc('month', service_order.paid_at)::date AS starts_on,
             count(*)::int AS order_count,
             COALESCE(sum(service_order.total), 0) AS income,
             COALESCE(sum(service_order.total_cost), 0) AS direct_cost,
             COALESCE(sum(service_order.gross_profit), 0) AS gross_profit
           FROM bounds JOIN ${schema}.orders service_order
             ON service_order.status = 'completed' AND service_order.is_paid = true
            AND service_order.paid_at >= bounds.range_start
            AND service_order.paid_at < bounds.focus_end
           GROUP BY date_trunc('month', service_order.paid_at)::date
         ), expense_totals AS (
           SELECT date_trunc('month', expense.occurred_on)::date AS starts_on,
             COALESCE(sum(expense.amount), 0) AS amount
           FROM bounds JOIN ${schema}.expenses expense
             ON expense.status = 'confirmed'
            AND expense.occurred_on >= bounds.range_start
            AND expense.occurred_on < bounds.focus_end
           GROUP BY date_trunc('month', expense.occurred_on)::date
         )
         SELECT to_char(months.starts_on, 'YYYY-MM') AS period,
           months.starts_on::text,
           (months.starts_on + interval '1 month - 1 day')::date::text AS ends_on,
           COALESCE(generated.completed_order_count, 0)::int AS completed_order_count,
           COALESCE(generated.incomplete_order_count, 0)::int AS incomplete_order_count,
           COALESCE(generated.income, 0)::numeric(14,2)::text AS generated_income,
           COALESCE(generated.direct_cost, 0)::numeric(14,2)::text AS generated_direct_cost,
           COALESCE(generated.gross_profit, 0)::numeric(14,2)::text AS generated_gross_profit,
           COALESCE(expense_totals.amount, 0)::numeric(14,2)::text AS operating_expenses,
           (COALESCE(generated.gross_profit, 0) - COALESCE(expense_totals.amount, 0))
             ::numeric(14,2)::text AS generated_net_profit,
           CASE WHEN COALESCE(generated.income, 0) = 0 THEN NULL ELSE
             round((COALESCE(generated.gross_profit, 0) - COALESCE(expense_totals.amount, 0))
               / generated.income * 100, 2)::text
           END AS generated_net_margin_percent,
           COALESCE(collected.order_count, 0)::int AS collected_order_count,
           COALESCE(collected.income, 0)::numeric(14,2)::text AS collected_income,
           COALESCE(collected.direct_cost, 0)::numeric(14,2)::text AS collected_direct_cost,
           COALESCE(collected.gross_profit, 0)::numeric(14,2)::text AS collected_gross_profit,
           (COALESCE(collected.gross_profit, 0) - COALESCE(expense_totals.amount, 0))
             ::numeric(14,2)::text AS collected_net_result
         FROM months
         LEFT JOIN generated USING (starts_on)
         LEFT JOIN collected USING (starts_on)
         LEFT JOIN expense_totals USING (starts_on)
         ORDER BY months.starts_on`,
        parameters,
      )) as AnalyticsMonthRow[];

      const collectionRows = (await runner.query(
        `WITH bounds AS (${bounds})
         SELECT count(*) FILTER (WHERE service_order.is_paid)::int AS paid_order_count,
           COALESCE(sum(service_order.total) FILTER (WHERE service_order.is_paid), 0)
             ::numeric(14,2)::text AS paid_amount,
           count(*) FILTER (WHERE NOT service_order.is_paid)::int AS pending_order_count,
           COALESCE(sum(service_order.total) FILTER (WHERE NOT service_order.is_paid), 0)
             ::numeric(14,2)::text AS pending_amount
         FROM bounds LEFT JOIN ${schema}.orders service_order
           ON service_order.status = 'completed'
          AND service_order.closed_at >= bounds.focus_start
          AND service_order.closed_at < bounds.focus_end`,
        parameters,
      )) as CollectionBreakdownRow[];

      const expenseRows = (await runner.query(
        `WITH bounds AS (${bounds}), category_totals AS (
           SELECT category.id AS category_id, category.code AS category_code,
             category.name AS category_name, count(*)::int AS expense_count,
             sum(expense.amount) AS amount
           FROM bounds
           JOIN ${schema}.expenses expense
             ON expense.status = 'confirmed'
            AND expense.occurred_on >= bounds.focus_start
            AND expense.occurred_on < bounds.focus_end
           JOIN ${schema}.expense_categories category ON category.id = expense.category_id
           GROUP BY category.id, category.code, category.name
         )
         SELECT category_id, category_code, category_name, expense_count,
           amount::numeric(14,2)::text AS amount,
           CASE WHEN sum(amount) OVER () = 0 THEN NULL
             ELSE round(amount / sum(amount) OVER () * 100, 2)::text
           END AS percentage
         FROM category_totals
         ORDER BY amount DESC, category_name`,
        parameters,
      )) as ExpenseCategoryAnalyticsRow[];

      const series = monthRows.map((row) => this.toAnalyticsMonth(row));
      const summary = series.at(-1);
      if (!summary) throw new Error('No se pudo generar el periodo analítico');
      const collection = collectionRows[0]!;
      return {
        months: query.months,
        occurredFrom: series[0]!.startsOn,
        occurredTo: summary.endsOn,
        summary,
        series,
        collection: {
          paidOrderCount: collection.paid_order_count,
          paidAmount: collection.paid_amount,
          pendingOrderCount: collection.pending_order_count,
          pendingAmount: collection.pending_amount,
        },
        expensesByCategory: expenseRows.map((row) => ({
          categoryId: row.category_id,
          categoryCode: row.category_code,
          categoryName: row.category_name,
          expenseCount: row.expense_count,
          amount: row.amount,
          percentage: row.percentage,
        })),
      };
    });
  }

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
           SELECT count(service_order.id)::int AS completed_order_count,
             count(*) FILTER (
               WHERE service_order.id IS NOT NULL
                 AND EXISTS (
                   SELECT 1 FROM ${schema}.order_items item
                   WHERE item.order_id = service_order.id
                     AND ((item.affects_order_total = true AND item.unit_price IS NULL)
                       OR (${unknownOrderItemCostSql('item')}))
                 )
             )::int AS incomplete_order_count,
             count(*) FILTER (
               WHERE service_order.id IS NOT NULL
                 AND EXISTS (
                   SELECT 1 FROM ${schema}.order_items item
                   WHERE item.order_id = service_order.id
                     AND item.affects_order_total = true
                     AND item.unit_price IS NULL
                 )
             )::int AS missing_price_order_count,
             count(*) FILTER (
               WHERE service_order.id IS NOT NULL
                 AND EXISTS (
                   SELECT 1 FROM ${schema}.order_items item
                   WHERE item.order_id = service_order.id
                     AND ${unknownOrderItemCostSql('item')}
                 )
             )::int AS missing_cost_order_count,
             count(*) FILTER (WHERE service_order.is_paid = true)::int
               AS paid_completed_order_count,
             count(*) FILTER (WHERE service_order.is_paid = false)::int
               AS unpaid_completed_order_count,
             COALESCE(sum(service_order.total) FILTER (WHERE service_order.total IS NOT NULL), 0)
               AS income,
             COALESCE(sum(service_order.total) FILTER (
               WHERE service_order.is_paid = true AND service_order.total IS NOT NULL
             ), 0) AS collected_income,
             COALESCE(sum(service_order.total) FILTER (
               WHERE service_order.is_paid = false AND service_order.total IS NOT NULL
             ), 0) AS outstanding_income,
             COALESCE(sum(service_order.total_cost) FILTER (
               WHERE service_order.total_cost IS NOT NULL
             ), 0) AS direct_cost,
             COALESCE(sum(service_order.gross_profit) FILTER (
               WHERE service_order.gross_profit IS NOT NULL
             ), 0) AS gross_profit,
             COALESCE(sum(service_order.gross_profit) FILTER (
               WHERE service_order.is_paid = true AND service_order.gross_profit IS NOT NULL
             ), 0) AS collected_gross_profit
           FROM bounds LEFT JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
         ), receivables AS (
           SELECT count(service_order.id)::int AS receivable_order_count,
             COALESCE(sum(service_order.total), 0) AS receivable_amount
           FROM bounds LEFT JOIN ${schema}.orders service_order
             ON service_order.status <> 'cancelled'
            AND service_order.is_paid = false
            AND service_order.total IS NOT NULL
            AND service_order.created_at::date <= bounds.to_date
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
           order_totals.missing_price_order_count,
           order_totals.missing_cost_order_count,
           order_totals.paid_completed_order_count, order_totals.unpaid_completed_order_count,
           receivables.receivable_order_count,
           order_totals.income::numeric(14,2)::text AS income,
           order_totals.collected_income::numeric(14,2)::text AS collected_income,
           order_totals.outstanding_income::numeric(14,2)::text AS outstanding_income,
           receivables.receivable_amount::numeric(14,2)::text AS receivable_amount,
           order_totals.direct_cost::numeric(14,2)::text AS direct_cost,
           fifo.fifo_product_cost::numeric(14,2)::text AS fifo_product_cost,
           order_totals.gross_profit::numeric(14,2)::text AS gross_profit,
           order_totals.collected_gross_profit::numeric(14,2)::text AS collected_gross_profit,
           expense_totals.operating_expenses::numeric(14,2)::text AS operating_expenses,
           (order_totals.gross_profit - expense_totals.operating_expenses)::numeric(14,2)::text
             AS net_profit,
           (order_totals.collected_gross_profit - expense_totals.operating_expenses)
             ::numeric(14,2)::text AS collected_net_result,
           CASE WHEN order_totals.income = 0 THEN NULL ELSE
             round(order_totals.gross_profit / order_totals.income * 100, 2)::text
           END AS gross_margin_percent,
           CASE WHEN order_totals.income = 0 THEN NULL ELSE
             round((order_totals.gross_profit - expense_totals.operating_expenses)
               / order_totals.income * 100, 2)::text
           END AS net_margin_percent
         FROM bounds CROSS JOIN order_totals CROSS JOIN receivables CROSS JOIN fifo
         CROSS JOIN expense_totals`,
        parameters,
      )) as TotalsRow[];
      const byDay = await this.periodRows(runner, schema, bounds, parameters, 'day');
      const byMonth = await this.periodRows(runner, schema, bounds, parameters, 'month');
      const customerRows = (await runner.query(
        `WITH bounds AS (${bounds})
         SELECT customer.id AS customer_id, customer.display_name AS customer_name,
           customer.customer_type, count(*)::int AS completed_order_count,
           COALESCE(sum(service_order.total), 0)::numeric(14,2)::text AS income,
           COALESCE(sum(service_order.total) FILTER (WHERE service_order.is_paid), 0)
             ::numeric(14,2)::text AS collected_income,
           COALESCE(sum(service_order.total) FILTER (WHERE NOT service_order.is_paid), 0)
             ::numeric(14,2)::text AS outstanding_income,
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
         SELECT item.kind AS type,
             CASE WHEN item.affects_order_total THEN item.total ELSE 0 END AS total,
             item.cost_total
           FROM bounds
           JOIN ${schema}.orders service_order
             ON service_order.status = 'completed'
            AND service_order.closed_at::date BETWEEN bounds.from_date AND bounds.to_date
           JOIN ${schema}.order_items item ON item.order_id = service_order.id
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
           service_order.gross_profit::text AS gross_profit,
           NOT EXISTS (
             SELECT 1 FROM ${schema}.order_items item
             WHERE item.order_id = service_order.id
               AND ((item.affects_order_total = true AND item.unit_price IS NULL)
                 OR (${unknownOrderItemCostSql('item')}))
           ) AS is_complete,
           service_order.is_paid
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
          missingPriceOrderCount: totals.missing_price_order_count,
          missingCostOrderCount: totals.missing_cost_order_count,
          paidCompletedOrderCount: totals.paid_completed_order_count,
          unpaidCompletedOrderCount: totals.unpaid_completed_order_count,
          receivableOrderCount: totals.receivable_order_count,
          income: totals.income,
          collectedIncome: totals.collected_income,
          outstandingIncome: totals.outstanding_income,
          receivableAmount: totals.receivable_amount,
          directCost: totals.direct_cost,
          fifoProductCost: totals.fifo_product_cost,
          grossProfit: totals.gross_profit,
          collectedGrossProfit: totals.collected_gross_profit,
          operatingExpenses: totals.operating_expenses,
          netProfit: totals.net_profit,
          collectedNetResult: totals.collected_net_result,
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
           COALESCE(sum(service_order.total) FILTER (WHERE service_order.is_paid), 0)
             AS collected_income,
           COALESCE(sum(service_order.total) FILTER (WHERE NOT service_order.is_paid), 0)
             AS outstanding_income,
           COALESCE(sum(service_order.total_cost), 0) AS direct_cost,
           COALESCE(sum(service_order.gross_profit), 0) AS gross_profit,
           COALESCE(sum(service_order.gross_profit) FILTER (WHERE service_order.is_paid), 0)
             AS collected_gross_profit
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
         COALESCE(order_period.collected_income, 0)::numeric(14,2)::text AS collected_income,
         COALESCE(order_period.outstanding_income, 0)::numeric(14,2)::text AS outstanding_income,
         COALESCE(order_period.direct_cost, 0)::numeric(14,2)::text AS direct_cost,
         COALESCE(order_period.gross_profit, 0)::numeric(14,2)::text AS gross_profit,
         COALESCE(expense_period.operating_expenses, 0)::numeric(14,2)::text
           AS operating_expenses,
         (COALESCE(order_period.gross_profit, 0)
           - COALESCE(expense_period.operating_expenses, 0))::numeric(14,2)::text AS net_profit,
         (COALESCE(order_period.collected_gross_profit, 0)
           - COALESCE(expense_period.operating_expenses, 0))::numeric(14,2)::text
           AS collected_net_result
       FROM order_period FULL JOIN expense_period USING (period)
       ORDER BY COALESCE(order_period.period, expense_period.period)`,
      parameters,
    )) as PeriodRow[];
    return rows.map((row) => ({
      period: row.period,
      completedOrderCount: row.completed_order_count,
      income: row.income,
      collectedIncome: row.collected_income,
      outstandingIncome: row.outstanding_income,
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
      operatingExpenses: row.operating_expenses,
      netProfit: row.net_profit,
      collectedNetResult: row.collected_net_result,
    }));
  }

  private toCustomer(row: CustomerRow): ProfitabilityCustomerRowResponseDto {
    return {
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerType: row.customer_type,
      completedOrderCount: row.completed_order_count,
      income: row.income,
      collectedIncome: row.collected_income,
      outstandingIncome: row.outstanding_income,
      directCost: row.direct_cost,
      grossProfit: row.gross_profit,
    };
  }

  private toAnalyticsMonth(row: AnalyticsMonthRow): ProfitabilityAnalyticsMonthResponseDto {
    return {
      period: row.period,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      completedOrderCount: row.completed_order_count,
      incompleteOrderCount: row.incomplete_order_count,
      generatedIncome: row.generated_income,
      generatedDirectCost: row.generated_direct_cost,
      generatedGrossProfit: row.generated_gross_profit,
      operatingExpenses: row.operating_expenses,
      generatedNetProfit: row.generated_net_profit,
      generatedNetMarginPercent: row.generated_net_margin_percent,
      collectedOrderCount: row.collected_order_count,
      collectedIncome: row.collected_income,
      collectedDirectCost: row.collected_direct_cost,
      collectedGrossProfit: row.collected_gross_profit,
      collectedNetResult: row.collected_net_result,
      isComplete: row.incomplete_order_count === 0,
    };
  }

  private toServiceType(row: ServiceTypeRow): ProfitabilityServiceTypeRowResponseDto {
    const names = { service: 'Servicios', product: 'Productos' };
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
      isComplete: row.is_complete,
      isPaid: row.is_paid,
    };
  }
}
