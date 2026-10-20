import { BadRequestException } from '@nestjs/common';
import {
  BillingReconciliationInvoice,
  BillingReconciliationOrder,
  BillingReconciliationService,
} from './billing-reconciliation.service';

const period = {
  startsAt: '2026-10-01T00:00:00.000Z',
  endsBefore: '2026-11-01T00:00:00.000Z',
};

function invoice(
  overrides: Partial<BillingReconciliationInvoice> = {},
): BillingReconciliationInvoice {
  return {
    id: 'invoice-1',
    status: 'issued',
    subtotal: '1000.00',
    transferredTax: '160.00',
    total: '1160.00',
    paymentMethodCode: 'PUE',
    issuedAt: '2026-10-12T18:00:00.000Z',
    cancelledAt: null,
    ...overrides,
  };
}

function order(overrides: Partial<BillingReconciliationOrder> = {}): BillingReconciliationOrder {
  return {
    id: 'order-1',
    status: 'completed',
    operationalAmount: '1000.00',
    directCost: '400.00',
    hasIncompleteCosts: false,
    completedAt: '2026-10-10T18:00:00.000Z',
    isPaid: true,
    paidAt: '2026-10-11T18:00:00.000Z',
    invoices: [],
    ...overrides,
  };
}

describe('BillingReconciliationService', () => {
  const service = new BillingReconciliationService();

  it('mantiene un borrador dentro de pendientes y separa el importe operativo del fiscal', () => {
    const result = service.calculate(
      [
        order({
          operationalAmount: '1000.00',
          invoices: [invoice({ status: 'draft', issuedAt: null })],
        }),
        order({
          id: 'order-2',
          operationalAmount: '2000.00',
          invoices: [invoice({ id: 'invoice-2', total: '2320.00' })],
        }),
      ],
      [],
      period,
    );

    expect(result.snapshot).toEqual({
      pendingToInvoiceCount: 1,
      pendingToInvoiceOperationalAmount: '1000.00',
      activeDraftCount: 1,
      activeDraftOperationalAmount: '1000.00',
      ppdPendingCollectionCount: 0,
      ppdPendingCollectionOperationalAmount: '0.00',
      ppdPendingCollectionSimulatedTotal: '0.00',
    });
    expect(result.completionPeriod.issuedOrderOperationalAmount).toBe('2000.00');
    expect(result.completionPeriod.issuedSimulationTotal).toBe('2320.00');
    expect(result.completionPeriod.generatedOperationalAmount).toBe('3000.00');
  });

  it('clasifica terminación, pago y emisión mediante fechas independientes', () => {
    const result = service.calculate(
      [
        order({
          completedAt: '2026-09-28T18:00:00.000Z',
          paidAt: '2026-10-03T18:00:00.000Z',
          invoices: [invoice({ issuedAt: '2026-10-04T18:00:00.000Z' })],
        }),
        order({
          id: 'order-2',
          completedAt: '2026-10-05T18:00:00.000Z',
          isPaid: false,
          paidAt: null,
          invoices: [invoice({ id: 'invoice-2', issuedAt: '2026-11-02T18:00:00.000Z' })],
        }),
      ],
      [],
      period,
    );

    expect(result.completionPeriod.completedOrderCount).toBe(1);
    expect(result.completionPeriod.issuedOrderCount).toBe(1);
    expect(result.completionPeriod.generatedOperationalAmount).toBe('1000.00');
    expect(result.completionPeriod.issuedOrderOperationalAmount).toBe('1000.00');
    expect(result.paymentPeriod.collectedOrderCount).toBe(1);
    expect(result.paymentPeriod.collectedOperationalAmount).toBe('1000.00');
    expect(result.issuancePeriod.issuedSimulationCount).toBe(1);
    expect(result.issuancePeriod.simulatedTotal).toBe('1160.00');
  });

  it('separa PUE y PPD del estatus de cobro sin duplicar órdenes', () => {
    const result = service.calculate(
      [
        order({
          id: 'pue-paid',
          operationalAmount: '1000.00',
          invoices: [invoice({ id: 'invoice-pue', paymentMethodCode: 'PUE' })],
        }),
        order({
          id: 'ppd-pending',
          operationalAmount: '2000.00',
          isPaid: false,
          paidAt: null,
          invoices: [
            invoice({
              id: 'invoice-ppd-pending',
              paymentMethodCode: 'PPD',
              subtotal: '2000.00',
              transferredTax: '320.00',
              total: '2320.00',
            }),
          ],
        }),
        order({
          id: 'ppd-paid',
          operationalAmount: '3000.00',
          invoices: [
            invoice({
              id: 'invoice-ppd-paid',
              paymentMethodCode: 'PPD',
              subtotal: '3000.00',
              transferredTax: '480.00',
              total: '3480.00',
            }),
          ],
        }),
      ],
      [],
      period,
    );

    expect(result.completionPeriod).toMatchObject({
      completedOrderCount: 3,
      generatedOperationalAmount: '6000.00',
      collectedOrderCount: 2,
      collectedOperationalAmount: '4000.00',
      pendingCollectionOrderCount: 1,
      pendingCollectionOperationalAmount: '2000.00',
      issuedOrderCount: 3,
      issuedOrderOperationalAmount: '6000.00',
    });
    expect(result.snapshot).toMatchObject({
      ppdPendingCollectionCount: 1,
      ppdPendingCollectionOperationalAmount: '2000.00',
      ppdPendingCollectionSimulatedTotal: '2320.00',
    });
  });

  it('no modifica ingresos ni utilidad al crear, emitir o cancelar simulaciones', () => {
    const variants: BillingReconciliationOrder[][] = [
      [order()],
      [order({ invoices: [invoice({ status: 'draft', issuedAt: null })] })],
      [order({ invoices: [invoice()] })],
      [
        order({
          invoices: [
            invoice({
              status: 'cancelled',
              cancelledAt: '2026-10-15T18:00:00.000Z',
            }),
          ],
        }),
      ],
    ];

    const financials = variants.map(
      (orders) =>
        service.calculate(
          orders,
          [
            {
              amount: '100.00',
              occurredAt: '2026-10-20T18:00:00.000Z',
              status: 'confirmed',
            },
          ],
          period,
        ).profitability,
    );

    expect(new Set(financials.map((value) => JSON.stringify(value))).size).toBe(1);
    expect(financials[0]).toEqual({
      generatedOperationalAmount: '1000.00',
      knownDirectCost: '400.00',
      provisionalGrossProfit: '600.00',
      operatingExpenses: '100.00',
      provisionalOperatingProfit: '500.00',
      incompleteCostOrderCount: 0,
    });
  });

  it('trata una cancelada como pendiente y conserva por separado su periodo de cancelación', () => {
    const result = service.calculate(
      [
        order({
          invoices: [
            invoice({
              status: 'cancelled',
              cancelledAt: '2026-10-15T18:00:00.000Z',
            }),
          ],
        }),
      ],
      [],
      period,
    );

    expect(result.snapshot.pendingToInvoiceCount).toBe(1);
    expect(result.issuancePeriod.issuedSimulationCount).toBe(0);
    expect(result.cancellationPeriod).toEqual({
      cancelledSimulationCount: 1,
      cancelledSimulatedTotal: '1160.00',
    });
  });

  it('identifica PPD pendiente sin confundir el total simulado con la cuenta por cobrar', () => {
    const result = service.calculate(
      [
        order({
          operationalAmount: '1500.00',
          isPaid: false,
          paidAt: null,
          invoices: [invoice({ paymentMethodCode: 'PPD', total: '1740.00' })],
        }),
      ],
      [],
      period,
    );

    expect(result.snapshot.ppdPendingCollectionCount).toBe(1);
    expect(result.snapshot.ppdPendingCollectionOperationalAmount).toBe('1500.00');
    expect(result.snapshot.ppdPendingCollectionSimulatedTotal).toBe('1740.00');
    expect(result.completionPeriod.pendingCollectionOperationalAmount).toBe('1500.00');
  });

  it('excluye una orden reabierta de la operación aunque conserve historial cancelado', () => {
    const result = service.calculate(
      [
        order({
          status: 'in_progress',
          completedAt: '2026-10-10T18:00:00.000Z',
          isPaid: false,
          paidAt: null,
          invoices: [
            invoice({
              status: 'cancelled',
              cancelledAt: '2026-10-15T18:00:00.000Z',
            }),
          ],
        }),
      ],
      [],
      period,
    );

    expect(result.snapshot.pendingToInvoiceCount).toBe(0);
    expect(result.completionPeriod.completedOrderCount).toBe(0);
    expect(result.completionPeriod.generatedOperationalAmount).toBe('0.00');
    expect(result.cancellationPeriod).toEqual({
      cancelledSimulationCount: 1,
      cancelledSimulatedTotal: '1160.00',
    });
  });

  it('cuenta una nueva emisión una sola vez después de cancelar la anterior', () => {
    const result = service.calculate(
      [
        order({
          invoices: [
            invoice({
              id: 'invoice-cancelled',
              status: 'cancelled',
              cancelledAt: '2026-10-15T18:00:00.000Z',
            }),
            invoice({ id: 'invoice-active' }),
          ],
        }),
      ],
      [],
      period,
    );

    expect(result.completionPeriod).toMatchObject({
      completedOrderCount: 1,
      generatedOperationalAmount: '1000.00',
      issuedOrderCount: 1,
      issuedOrderOperationalAmount: '1000.00',
      issuedSimulationTotal: '1160.00',
    });
    expect(result.issuancePeriod).toMatchObject({
      issuedSimulationCount: 1,
      simulatedTotal: '1160.00',
    });
    expect(result.cancellationPeriod).toEqual({
      cancelledSimulationCount: 1,
      cancelledSimulatedTotal: '1160.00',
    });
  });

  it('rechaza más de una simulación activa para la misma orden', () => {
    expect(() =>
      service.calculate(
        [
          order({
            invoices: [invoice({ status: 'draft', issuedAt: null }), invoice({ id: 'invoice-2' })],
          }),
        ],
        [],
        period,
      ),
    ).toThrow(BadRequestException);
  });
});
