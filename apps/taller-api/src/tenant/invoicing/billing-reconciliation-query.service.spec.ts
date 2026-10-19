import { BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { TenantSessionService } from '../tenant-session.service';
import { BillingReconciliationQueryService } from './billing-reconciliation-query.service';
import { BillingReconciliationService } from './billing-reconciliation.service';

const aggregateRow = {
  starts_at: new Date('2026-10-01T07:00:00.000Z'),
  ends_before: new Date('2026-11-01T07:00:00.000Z'),
  snapshot_pending_count: 2,
  snapshot_pending_amount: '2100.00',
  snapshot_draft_count: 1,
  snapshot_draft_amount: '900.00',
  snapshot_ppd_pending_count: 1,
  snapshot_ppd_pending_amount: '1200.00',
  snapshot_ppd_pending_simulated_total: '1392.00',
  completed_count: 3,
  generated_amount: '4100.00',
  cohort_collected_count: 2,
  cohort_collected_amount: '2900.00',
  cohort_pending_collection_count: 1,
  cohort_pending_collection_amount: '1200.00',
  cohort_issued_count: 1,
  cohort_issued_operational_amount: '2000.00',
  cohort_issued_subtotal: '2000.00',
  cohort_issued_tax: '320.00',
  cohort_issued_total: '2320.00',
  cohort_pending_invoice_count: 2,
  cohort_pending_invoice_amount: '2100.00',
  incomplete_cost_count: 1,
  known_direct_cost: '1000.00',
  paid_in_period_count: 2,
  paid_in_period_amount: '2900.00',
  issued_in_period_count: 1,
  issued_in_period_subtotal: '2000.00',
  issued_in_period_tax: '320.00',
  issued_in_period_total: '2320.00',
  cancelled_in_period_count: 1,
  cancelled_in_period_total: '580.00',
  operating_expenses: '600.00',
};

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  companyId: '00000000-0000-4000-8000-000000000002',
} as AuthenticatedUser;

describe('BillingReconciliationQueryService', () => {
  function setup() {
    const query = jest.fn().mockResolvedValue([aggregateRow]);
    const runner = { query } as unknown as QueryRunner;
    const tenant = {
      run: jest.fn(
        (_user: AuthenticatedUser, work: (value: QueryRunner, schema: string) => unknown) =>
          work(runner, '_0001_mul_demo'),
      ),
    } as unknown as TenantSessionService;
    return {
      query,
      service: new BillingReconciliationQueryService(tenant, new BillingReconciliationService()),
    };
  }

  it('obtiene todos los indicadores con una sola consulta agregada y sin cargar órdenes', async () => {
    const { query, service } = setup();

    const result = await service.summary(user, {
      occurredFrom: '2026-10-01',
      occurredTo: '2026-10-31',
    });

    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('order_stats AS');
    expect(sql).toContain('invoice_stats AS');
    expect(sql).toContain('expense_stats AS');
    expect(parameters).toEqual([user.id, '2026-10-01', '2026-10-31']);
    expect(result.completionPeriod).toMatchObject({
      generatedOperationalAmount: '4100.00',
      issuedOrderOperationalAmount: '2000.00',
      issuedSimulationTotal: '2320.00',
    });
    expect(result.profitability).toMatchObject({
      provisionalGrossProfit: '3100.00',
      provisionalOperatingProfit: '2500.00',
    });
  });

  it('proyecta Facturación sin costos, gastos, utilidad o márgenes', async () => {
    const { service } = setup();

    const result = await service.invoicing(user, {});

    expect(result).toMatchObject({
      pendingToInvoiceCount: 2,
      activeDraftCount: 1,
      issuedSimulationCount: 1,
      ppdPendingCollectionCount: 1,
    });
    expect(result).not.toHaveProperty('profitability');
    expect(result).not.toHaveProperty('knownDirectCost');
    expect(result).not.toHaveProperty('operatingExpenses');
  });

  it('rechaza un periodo invertido antes de consultar PostgreSQL', async () => {
    const { query, service } = setup();

    await expect(
      service.summary(user, { occurredFrom: '2026-11-01', occurredTo: '2026-10-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });
});
