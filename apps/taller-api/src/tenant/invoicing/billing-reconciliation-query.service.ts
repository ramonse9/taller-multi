import { BadRequestException, Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { unknownOrderItemCostSql } from '../orders/order-cost-rules';
import { TenantSessionService } from '../tenant-session.service';
import {
  BillingReconciliationAggregates,
  BillingReconciliationService,
  BillingReconciliationSummary,
} from './billing-reconciliation.service';
import {
  BillingReconciliationPeriodQueryDto,
  DashboardBillingReconciliationResponseDto,
  InvoiceBillingReconciliationResponseDto,
  ProfitabilityBillingReconciliationResponseDto,
} from './dto/billing-reconciliation.dto';

interface ReconciliationAggregateRow {
  starts_at: Date;
  ends_before: Date;
  snapshot_pending_count: number;
  snapshot_pending_amount: string;
  snapshot_draft_count: number;
  snapshot_draft_amount: string;
  snapshot_ppd_pending_count: number;
  snapshot_ppd_pending_amount: string;
  snapshot_ppd_pending_simulated_total: string;
  completed_count: number;
  generated_amount: string;
  cohort_collected_count: number;
  cohort_collected_amount: string;
  cohort_pending_collection_count: number;
  cohort_pending_collection_amount: string;
  cohort_issued_count: number;
  cohort_issued_operational_amount: string;
  cohort_issued_subtotal: string;
  cohort_issued_tax: string;
  cohort_issued_total: string;
  cohort_pending_invoice_count: number;
  cohort_pending_invoice_amount: string;
  incomplete_cost_count: number;
  known_direct_cost: string;
  paid_in_period_count: number;
  paid_in_period_amount: string;
  issued_in_period_count: number;
  issued_in_period_subtotal: string;
  issued_in_period_tax: string;
  issued_in_period_total: string;
  cancelled_in_period_count: number;
  cancelled_in_period_total: string;
  operating_expenses: string;
}

@Injectable()
export class BillingReconciliationQueryService {
  constructor(
    private readonly tenant: TenantSessionService,
    private readonly calculator: BillingReconciliationService,
  ) {}

  async dashboard(
    user: AuthenticatedUser,
    query: BillingReconciliationPeriodQueryDto = {},
  ): Promise<DashboardBillingReconciliationResponseDto> {
    const summary = await this.summary(user, query);
    return {
      pendingToInvoiceCount: summary.snapshot.pendingToInvoiceCount,
      pendingToInvoiceOperationalAmount: summary.snapshot.pendingToInvoiceOperationalAmount,
      activeDraftCount: summary.snapshot.activeDraftCount,
      issuedThisPeriodCount: summary.issuancePeriod.issuedSimulationCount,
      issuedThisPeriodSimulatedTotal: summary.issuancePeriod.simulatedTotal,
      ppdPendingCollectionCount: summary.snapshot.ppdPendingCollectionCount,
    };
  }

  async profitability(
    user: AuthenticatedUser,
    query: BillingReconciliationPeriodQueryDto,
  ): Promise<ProfitabilityBillingReconciliationResponseDto> {
    const summary = await this.summary(user, query);
    return {
      period: summary.period,
      completedOrderCount: summary.completionPeriod.completedOrderCount,
      generatedOperationalAmount: summary.completionPeriod.generatedOperationalAmount,
      issuedOrderCount: summary.completionPeriod.issuedOrderCount,
      issuedOrderOperationalAmount: summary.completionPeriod.issuedOrderOperationalAmount,
      pendingToInvoiceCount: summary.completionPeriod.pendingToInvoiceCount,
      pendingToInvoiceOperationalAmount: summary.completionPeriod.pendingToInvoiceOperationalAmount,
      collectedOperationalAmount: summary.completionPeriod.collectedOperationalAmount,
      pendingCollectionOperationalAmount:
        summary.completionPeriod.pendingCollectionOperationalAmount,
      issuedSimulationSubtotal: summary.completionPeriod.issuedSimulationSubtotal,
      issuedSimulationTax: summary.completionPeriod.issuedSimulationTax,
      issuedSimulationTotal: summary.completionPeriod.issuedSimulationTotal,
      incompleteCostOrderCount: summary.completionPeriod.incompleteCostOrderCount,
    };
  }

  async invoicing(
    user: AuthenticatedUser,
    query: BillingReconciliationPeriodQueryDto,
  ): Promise<InvoiceBillingReconciliationResponseDto> {
    const summary = await this.summary(user, query);
    return {
      period: summary.period,
      pendingToInvoiceCount: summary.snapshot.pendingToInvoiceCount,
      pendingToInvoiceOperationalAmount: summary.snapshot.pendingToInvoiceOperationalAmount,
      activeDraftCount: summary.snapshot.activeDraftCount,
      activeDraftOperationalAmount: summary.snapshot.activeDraftOperationalAmount,
      issuedSimulationCount: summary.issuancePeriod.issuedSimulationCount,
      issuedSimulationSubtotal: summary.issuancePeriod.simulatedSubtotal,
      issuedSimulationTax: summary.issuancePeriod.simulatedTax,
      issuedSimulationTotal: summary.issuancePeriod.simulatedTotal,
      cancelledSimulationCount: summary.cancellationPeriod.cancelledSimulationCount,
      cancelledSimulatedTotal: summary.cancellationPeriod.cancelledSimulatedTotal,
      ppdPendingCollectionCount: summary.snapshot.ppdPendingCollectionCount,
      ppdPendingCollectionOperationalAmount: summary.snapshot.ppdPendingCollectionOperationalAmount,
      ppdPendingCollectionSimulatedTotal: summary.snapshot.ppdPendingCollectionSimulatedTotal,
    };
  }

  async summary(
    user: AuthenticatedUser,
    query: BillingReconciliationPeriodQueryDto,
  ): Promise<BillingReconciliationSummary> {
    this.validatePeriod(query);
    return this.tenant.run(user, async (runner, schemaName) => {
      const row = await this.aggregate(runner, quoteIdentifier(schemaName), user.id, query);
      return this.calculator.summarize(
        { startsAt: row.starts_at, endsBefore: row.ends_before },
        this.toAggregates(row),
      );
    });
  }

  private async aggregate(
    runner: QueryRunner,
    schema: string,
    userId: string,
    query: BillingReconciliationPeriodQueryDto,
  ): Promise<ReconciliationAggregateRow> {
    const rows = (await runner.query(
      `WITH user_context AS (
         SELECT timezone_code
         FROM public.users
         WHERE id = $1
       ), period_dates AS (
         SELECT timezone_code,
           COALESCE($2::date,
             date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE timezone_code)::date
           ) AS starts_on,
           COALESCE($3::date,
             (date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE timezone_code)
               + interval '1 month - 1 day')::date
           ) AS ends_on
         FROM user_context
       ), period AS (
         SELECT starts_on::timestamp AT TIME ZONE timezone_code AS starts_at,
           (ends_on + 1)::timestamp AT TIME ZONE timezone_code AS ends_before,
           starts_on, ends_on + 1 AS ends_before_date
         FROM period_dates
       ), active_invoices AS (
         SELECT invoice.order_id, invoice.status, invoice.payment_method_code,
           invoice.subtotal, invoice.transferred_tax, invoice.total
         FROM ${schema}.simulated_invoices invoice
         WHERE invoice.status IN ('draft','issued')
       ), order_stats AS (
         SELECT
           count(*) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status IS DISTINCT FROM 'issued'
           )::int AS snapshot_pending_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status IS DISTINCT FROM 'issued'
           ), 0)::numeric(14,2)::text AS snapshot_pending_amount,
           count(*) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='draft'
           )::int AS snapshot_draft_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='draft'
           ), 0)::numeric(14,2)::text AS snapshot_draft_amount,
           count(*) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=false
               AND active_invoice.status='issued' AND active_invoice.payment_method_code='PPD'
           )::int AS snapshot_ppd_pending_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=false
               AND active_invoice.status='issued' AND active_invoice.payment_method_code='PPD'
           ), 0)::numeric(14,2)::text AS snapshot_ppd_pending_amount,
           COALESCE(sum(active_invoice.total) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=false
               AND active_invoice.status='issued' AND active_invoice.payment_method_code='PPD'
           ), 0)::numeric(14,2)::text AS snapshot_ppd_pending_simulated_total,
           count(*) FILTER (
             WHERE service_order.status='completed' AND service_order.closed_at >= period.starts_at
               AND service_order.closed_at < period.ends_before
           )::int AS completed_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND service_order.closed_at >= period.starts_at
               AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS generated_amount,
           count(*) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=true
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           )::int AS cohort_collected_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=true
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_collected_amount,
           count(*) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=false
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           )::int AS cohort_pending_collection_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=false
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_pending_collection_amount,
           count(*) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           )::int AS cohort_issued_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_issued_operational_amount,
           COALESCE(sum(active_invoice.subtotal) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_issued_subtotal,
           COALESCE(sum(active_invoice.transferred_tax) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_issued_tax,
           COALESCE(sum(active_invoice.total) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status='issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_issued_total,
           count(*) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status IS DISTINCT FROM 'issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           )::int AS cohort_pending_invoice_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND active_invoice.status IS DISTINCT FROM 'issued'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cohort_pending_invoice_amount,
           count(*) FILTER (
             WHERE service_order.status='completed'
               AND service_order.closed_at >= period.starts_at AND service_order.closed_at < period.ends_before
               AND EXISTS (
                 SELECT 1 FROM ${schema}.order_items item
                 WHERE item.order_id=service_order.id AND ${unknownOrderItemCostSql('item')}
               )
           )::int AS incomplete_cost_count,
           COALESCE(sum(COALESCE(service_order.total_cost, 0)) FILTER (
             WHERE service_order.status='completed' AND service_order.closed_at >= period.starts_at
               AND service_order.closed_at < period.ends_before
           ), 0)::numeric(14,2)::text AS known_direct_cost,
           count(*) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=true
               AND service_order.paid_at >= period.starts_at AND service_order.paid_at < period.ends_before
           )::int AS paid_in_period_count,
           COALESCE(sum(service_order.total) FILTER (
             WHERE service_order.status='completed' AND service_order.is_paid=true
               AND service_order.paid_at >= period.starts_at AND service_order.paid_at < period.ends_before
           ), 0)::numeric(14,2)::text AS paid_in_period_amount
         FROM ${schema}.orders service_order
         CROSS JOIN period
         LEFT JOIN active_invoices active_invoice ON active_invoice.order_id=service_order.id
       ), invoice_stats AS (
         SELECT count(*) FILTER (
             WHERE invoice.status='issued' AND invoice.issued_at >= period.starts_at
               AND invoice.issued_at < period.ends_before
           )::int AS issued_in_period_count,
           COALESCE(sum(invoice.subtotal) FILTER (
             WHERE invoice.status='issued' AND invoice.issued_at >= period.starts_at
               AND invoice.issued_at < period.ends_before
           ), 0)::numeric(14,2)::text AS issued_in_period_subtotal,
           COALESCE(sum(invoice.transferred_tax) FILTER (
             WHERE invoice.status='issued' AND invoice.issued_at >= period.starts_at
               AND invoice.issued_at < period.ends_before
           ), 0)::numeric(14,2)::text AS issued_in_period_tax,
           COALESCE(sum(invoice.total) FILTER (
             WHERE invoice.status='issued' AND invoice.issued_at >= period.starts_at
               AND invoice.issued_at < period.ends_before
           ), 0)::numeric(14,2)::text AS issued_in_period_total,
           count(*) FILTER (
             WHERE invoice.status='cancelled' AND invoice.cancelled_at >= period.starts_at
               AND invoice.cancelled_at < period.ends_before
           )::int AS cancelled_in_period_count,
           COALESCE(sum(invoice.total) FILTER (
             WHERE invoice.status='cancelled' AND invoice.cancelled_at >= period.starts_at
               AND invoice.cancelled_at < period.ends_before
           ), 0)::numeric(14,2)::text AS cancelled_in_period_total
         FROM ${schema}.simulated_invoices invoice CROSS JOIN period
       ), expense_stats AS (
         SELECT COALESCE(sum(expense.amount) FILTER (
             WHERE expense.status='confirmed' AND expense.occurred_on >= period.starts_on
               AND expense.occurred_on < period.ends_before_date
           ), 0)::numeric(14,2)::text AS operating_expenses
         FROM ${schema}.expenses expense CROSS JOIN period
       )
       SELECT period.starts_at, period.ends_before, order_stats.*, invoice_stats.*,
         expense_stats.operating_expenses
       FROM period CROSS JOIN order_stats CROSS JOIN invoice_stats CROSS JOIN expense_stats`,
      [userId, query.occurredFrom ?? null, query.occurredTo ?? null],
    )) as ReconciliationAggregateRow[];
    const row = rows[0];
    if (!row) throw new BadRequestException('No fue posible resolver el periodo del usuario');
    return row;
  }

  private validatePeriod(query: BillingReconciliationPeriodQueryDto): void {
    if (query.occurredFrom && query.occurredTo && query.occurredFrom > query.occurredTo) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
    }
  }

  private toAggregates(row: ReconciliationAggregateRow): BillingReconciliationAggregates {
    return {
      snapshotPendingCount: row.snapshot_pending_count,
      snapshotPendingAmount: row.snapshot_pending_amount,
      snapshotDraftCount: row.snapshot_draft_count,
      snapshotDraftAmount: row.snapshot_draft_amount,
      snapshotPpdPendingCount: row.snapshot_ppd_pending_count,
      snapshotPpdPendingAmount: row.snapshot_ppd_pending_amount,
      snapshotPpdPendingSimulatedTotal: row.snapshot_ppd_pending_simulated_total,
      completedCount: row.completed_count,
      generatedAmount: row.generated_amount,
      cohortCollectedCount: row.cohort_collected_count,
      cohortCollectedAmount: row.cohort_collected_amount,
      cohortPendingCollectionCount: row.cohort_pending_collection_count,
      cohortPendingCollectionAmount: row.cohort_pending_collection_amount,
      cohortIssuedCount: row.cohort_issued_count,
      cohortIssuedOperationalAmount: row.cohort_issued_operational_amount,
      cohortIssuedSubtotal: row.cohort_issued_subtotal,
      cohortIssuedTax: row.cohort_issued_tax,
      cohortIssuedTotal: row.cohort_issued_total,
      cohortPendingInvoiceCount: row.cohort_pending_invoice_count,
      cohortPendingInvoiceAmount: row.cohort_pending_invoice_amount,
      incompleteCostCount: row.incomplete_cost_count,
      knownDirectCost: row.known_direct_cost,
      paidInPeriodCount: row.paid_in_period_count,
      paidInPeriodAmount: row.paid_in_period_amount,
      issuedInPeriodCount: row.issued_in_period_count,
      issuedInPeriodSubtotal: row.issued_in_period_subtotal,
      issuedInPeriodTax: row.issued_in_period_tax,
      issuedInPeriodTotal: row.issued_in_period_total,
      cancelledInPeriodCount: row.cancelled_in_period_count,
      cancelledInPeriodTotal: row.cancelled_in_period_total,
      operatingExpenses: row.operating_expenses,
    };
  }
}
