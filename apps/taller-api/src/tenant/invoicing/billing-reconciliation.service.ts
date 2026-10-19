import { BadRequestException, Injectable } from '@nestjs/common';

export type ReconciliationMoney = string | number;
export type ReconciliationTimestamp = string | Date;
export type ReconciliationOrderStatus = 'in_progress' | 'completed' | 'cancelled';
export type ReconciliationInvoiceStatus = 'draft' | 'issued' | 'cancelled' | 'discarded';
export type ReconciliationPaymentMethod = 'PUE' | 'PPD';

export interface BillingReconciliationPeriod {
  startsAt: ReconciliationTimestamp;
  endsBefore: ReconciliationTimestamp;
}

export interface BillingReconciliationInvoice {
  id: string;
  status: ReconciliationInvoiceStatus;
  subtotal: ReconciliationMoney;
  transferredTax: ReconciliationMoney;
  total: ReconciliationMoney;
  paymentMethodCode: ReconciliationPaymentMethod;
  issuedAt: ReconciliationTimestamp | null;
  cancelledAt: ReconciliationTimestamp | null;
}

export interface BillingReconciliationOrder {
  id: string;
  status: ReconciliationOrderStatus;
  operationalAmount: ReconciliationMoney;
  directCost: ReconciliationMoney;
  hasIncompleteCosts: boolean;
  completedAt: ReconciliationTimestamp | null;
  isPaid: boolean;
  paidAt: ReconciliationTimestamp | null;
  invoices: readonly BillingReconciliationInvoice[];
}

export interface BillingReconciliationExpense {
  amount: ReconciliationMoney;
  occurredAt: ReconciliationTimestamp;
  status: 'draft' | 'confirmed' | 'cancelled';
}

export type BillingIndicatorTimeAxis =
  | 'current_snapshot'
  | 'order_completed_at'
  | 'order_paid_at'
  | 'invoice_issued_at'
  | 'invoice_cancelled_at'
  | 'expense_occurred_at';

export type BillingIndicatorAmountBasis =
  | 'none'
  | 'order_operational_total'
  | 'order_known_direct_cost'
  | 'expense_amount'
  | 'simulated_invoice_subtotal'
  | 'simulated_invoice_tax'
  | 'simulated_invoice_total';

export interface BillingIndicatorDefinition {
  label: string;
  timeAxis: BillingIndicatorTimeAxis;
  amountBasis: BillingIndicatorAmountBasis;
  formula: string;
}

export const BILLING_RECONCILIATION_DEFINITIONS = {
  generatedOperationalAmount: {
    label: 'Ingresos generados',
    timeAxis: 'order_completed_at',
    amountBasis: 'order_operational_total',
    formula: 'Suma de orders.total de órdenes terminadas dentro del periodo.',
  },
  collectedOperationalAmountFromCohort: {
    label: 'Importe cobrado de las órdenes terminadas en el periodo',
    timeAxis: 'order_completed_at',
    amountBasis: 'order_operational_total',
    formula:
      'Suma de orders.total de la cohorte terminada en el periodo cuyo estatus actual de cobro es pagado.',
  },
  collectedOperationalAmountInPeriod: {
    label: 'Ingresos cobrados en el periodo',
    timeAxis: 'order_paid_at',
    amountBasis: 'order_operational_total',
    formula: 'Suma de orders.total de órdenes terminadas cuya fecha de pago pertenece al periodo.',
  },
  pendingToInvoice: {
    label: 'Órdenes terminadas pendientes de facturar',
    timeAxis: 'current_snapshot',
    amountBasis: 'order_operational_total',
    formula:
      'Orden terminada sin una simulación activa emitida. Un borrador, una cancelada o una descartada siguen pendientes.',
  },
  activeDrafts: {
    label: 'Borradores activos',
    timeAxis: 'current_snapshot',
    amountBasis: 'order_operational_total',
    formula: 'Órdenes terminadas con una simulación activa en estatus draft.',
  },
  issuedOrderAmountFromCohort: {
    label: 'Importe operativo con simulación emitida',
    timeAxis: 'order_completed_at',
    amountBasis: 'order_operational_total',
    formula:
      'Suma de orders.total de la cohorte terminada en el periodo que actualmente tiene una simulación emitida activa.',
  },
  issuedSimulationTotalInPeriod: {
    label: 'Importe de simulaciones emitidas en el periodo',
    timeAxis: 'invoice_issued_at',
    amountBasis: 'simulated_invoice_total',
    formula:
      'Suma del total documental de simulaciones activas emitidas dentro del periodo; no se agrega a los ingresos.',
  },
  ppdPendingCollection: {
    label: 'Simulaciones PPD pendientes de cobro',
    timeAxis: 'current_snapshot',
    amountBasis: 'order_operational_total',
    formula: 'Órdenes terminadas no pagadas con una simulación activa emitida mediante PPD.',
  },
  incompleteCostOrders: {
    label: 'Órdenes con costos incompletos',
    timeAxis: 'order_completed_at',
    amountBasis: 'none',
    formula:
      'Conteo de órdenes terminadas en el periodo con al menos un costo de producto desconocido.',
  },
  directCost: {
    label: 'Costo directo conocido',
    timeAxis: 'order_completed_at',
    amountBasis: 'order_known_direct_cost',
    formula: 'Suma de orders.total_cost de las órdenes terminadas dentro del periodo.',
  },
  operatingExpenses: {
    label: 'Gastos operativos',
    timeAxis: 'expense_occurred_at',
    amountBasis: 'expense_amount',
    formula: 'Suma de gastos confirmados cuya fecha pertenece al periodo.',
  },
} as const satisfies Record<string, BillingIndicatorDefinition>;

export interface BillingReconciliationSummary {
  period: {
    startsAt: string;
    endsBefore: string;
  };
  snapshot: {
    pendingToInvoiceCount: number;
    pendingToInvoiceOperationalAmount: string;
    activeDraftCount: number;
    activeDraftOperationalAmount: string;
    ppdPendingCollectionCount: number;
    ppdPendingCollectionOperationalAmount: string;
    ppdPendingCollectionSimulatedTotal: string;
  };
  completionPeriod: {
    completedOrderCount: number;
    generatedOperationalAmount: string;
    collectedOrderCount: number;
    collectedOperationalAmount: string;
    pendingCollectionOrderCount: number;
    pendingCollectionOperationalAmount: string;
    issuedOrderCount: number;
    issuedOrderOperationalAmount: string;
    issuedSimulationSubtotal: string;
    issuedSimulationTax: string;
    issuedSimulationTotal: string;
    pendingToInvoiceCount: number;
    pendingToInvoiceOperationalAmount: string;
    incompleteCostOrderCount: number;
  };
  paymentPeriod: {
    collectedOrderCount: number;
    collectedOperationalAmount: string;
  };
  issuancePeriod: {
    issuedSimulationCount: number;
    simulatedSubtotal: string;
    simulatedTax: string;
    simulatedTotal: string;
  };
  cancellationPeriod: {
    cancelledSimulationCount: number;
    cancelledSimulatedTotal: string;
  };
  profitability: {
    generatedOperationalAmount: string;
    knownDirectCost: string;
    provisionalGrossProfit: string;
    operatingExpenses: string;
    provisionalOperatingProfit: string;
    incompleteCostOrderCount: number;
  };
}

interface InvoiceSelection {
  activeDraft: BillingReconciliationInvoice | null;
  activeIssued: BillingReconciliationInvoice | null;
}

@Injectable()
export class BillingReconciliationService {
  readonly definitions = BILLING_RECONCILIATION_DEFINITIONS;

  calculate(
    orders: readonly BillingReconciliationOrder[],
    expenses: readonly BillingReconciliationExpense[],
    period: BillingReconciliationPeriod,
  ): BillingReconciliationSummary {
    const startsAt = this.timestamp(period.startsAt, 'period.startsAt');
    const endsBefore = this.timestamp(period.endsBefore, 'period.endsBefore');
    if (startsAt >= endsBefore) {
      throw new BadRequestException('El inicio del periodo debe ser anterior a su fin exclusivo');
    }

    let snapshotPendingCount = 0;
    let snapshotPendingAmount = 0n;
    let snapshotDraftCount = 0;
    let snapshotDraftAmount = 0n;
    let snapshotPpdPendingCount = 0;
    let snapshotPpdPendingAmount = 0n;
    let snapshotPpdPendingSimulatedTotal = 0n;

    let completedCount = 0;
    let generatedAmount = 0n;
    let cohortCollectedCount = 0;
    let cohortCollectedAmount = 0n;
    let cohortPendingCollectionCount = 0;
    let cohortPendingCollectionAmount = 0n;
    let cohortIssuedCount = 0;
    let cohortIssuedOperationalAmount = 0n;
    let cohortIssuedSubtotal = 0n;
    let cohortIssuedTax = 0n;
    let cohortIssuedTotal = 0n;
    let cohortPendingInvoiceCount = 0;
    let cohortPendingInvoiceAmount = 0n;
    let incompleteCostCount = 0;
    let knownDirectCost = 0n;

    let paidInPeriodCount = 0;
    let paidInPeriodAmount = 0n;
    let issuedInPeriodCount = 0;
    let issuedInPeriodSubtotal = 0n;
    let issuedInPeriodTax = 0n;
    let issuedInPeriodTotal = 0n;
    let cancelledInPeriodCount = 0;
    let cancelledInPeriodTotal = 0n;

    for (const order of orders) {
      const operationalAmount = this.money(order.operationalAmount, `orden ${order.id}`);
      const directCost = this.money(order.directCost, `costo de orden ${order.id}`);
      const invoice = this.invoiceSelection(order);
      const isCompleted = order.status === 'completed' && order.completedAt !== null;

      if (isCompleted && !invoice.activeIssued) {
        snapshotPendingCount += 1;
        snapshotPendingAmount += operationalAmount;
      }
      if (isCompleted && invoice.activeDraft) {
        snapshotDraftCount += 1;
        snapshotDraftAmount += operationalAmount;
      }
      if (isCompleted && !order.isPaid && invoice.activeIssued?.paymentMethodCode === 'PPD') {
        snapshotPpdPendingCount += 1;
        snapshotPpdPendingAmount += operationalAmount;
        snapshotPpdPendingSimulatedTotal += this.money(
          invoice.activeIssued.total,
          `total simulado ${invoice.activeIssued.id}`,
        );
      }

      if (
        order.status === 'completed' &&
        order.isPaid &&
        order.paidAt !== null &&
        this.inPeriod(order.paidAt, startsAt, endsBefore)
      ) {
        paidInPeriodCount += 1;
        paidInPeriodAmount += operationalAmount;
      }

      for (const document of order.invoices) {
        if (
          document.status === 'issued' &&
          document.issuedAt !== null &&
          this.inPeriod(document.issuedAt, startsAt, endsBefore)
        ) {
          issuedInPeriodCount += 1;
          issuedInPeriodSubtotal += this.money(
            document.subtotal,
            `subtotal simulado ${document.id}`,
          );
          issuedInPeriodTax += this.money(
            document.transferredTax,
            `impuesto simulado ${document.id}`,
          );
          issuedInPeriodTotal += this.money(document.total, `total simulado ${document.id}`);
        }
        if (
          document.status === 'cancelled' &&
          document.cancelledAt !== null &&
          this.inPeriod(document.cancelledAt, startsAt, endsBefore)
        ) {
          cancelledInPeriodCount += 1;
          cancelledInPeriodTotal += this.money(
            document.total,
            `total simulado cancelado ${document.id}`,
          );
        }
      }

      if (!isCompleted || !this.inPeriod(order.completedAt!, startsAt, endsBefore)) continue;

      completedCount += 1;
      generatedAmount += operationalAmount;
      knownDirectCost += directCost;
      if (order.hasIncompleteCosts) incompleteCostCount += 1;

      if (order.isPaid) {
        cohortCollectedCount += 1;
        cohortCollectedAmount += operationalAmount;
      } else {
        cohortPendingCollectionCount += 1;
        cohortPendingCollectionAmount += operationalAmount;
      }

      if (invoice.activeIssued) {
        cohortIssuedCount += 1;
        cohortIssuedOperationalAmount += operationalAmount;
        cohortIssuedSubtotal += this.money(
          invoice.activeIssued.subtotal,
          `subtotal simulado ${invoice.activeIssued.id}`,
        );
        cohortIssuedTax += this.money(
          invoice.activeIssued.transferredTax,
          `impuesto simulado ${invoice.activeIssued.id}`,
        );
        cohortIssuedTotal += this.money(
          invoice.activeIssued.total,
          `total simulado ${invoice.activeIssued.id}`,
        );
      } else {
        cohortPendingInvoiceCount += 1;
        cohortPendingInvoiceAmount += operationalAmount;
      }
    }

    let operatingExpenses = 0n;
    for (const expense of expenses) {
      if (
        expense.status === 'confirmed' &&
        this.inPeriod(expense.occurredAt, startsAt, endsBefore)
      ) {
        operatingExpenses += this.money(expense.amount, 'gasto operativo');
      }
    }

    const grossProfit = generatedAmount - knownDirectCost;
    const operatingProfit = grossProfit - operatingExpenses;
    return {
      period: {
        startsAt: new Date(startsAt).toISOString(),
        endsBefore: new Date(endsBefore).toISOString(),
      },
      snapshot: {
        pendingToInvoiceCount: snapshotPendingCount,
        pendingToInvoiceOperationalAmount: this.format(snapshotPendingAmount),
        activeDraftCount: snapshotDraftCount,
        activeDraftOperationalAmount: this.format(snapshotDraftAmount),
        ppdPendingCollectionCount: snapshotPpdPendingCount,
        ppdPendingCollectionOperationalAmount: this.format(snapshotPpdPendingAmount),
        ppdPendingCollectionSimulatedTotal: this.format(snapshotPpdPendingSimulatedTotal),
      },
      completionPeriod: {
        completedOrderCount: completedCount,
        generatedOperationalAmount: this.format(generatedAmount),
        collectedOrderCount: cohortCollectedCount,
        collectedOperationalAmount: this.format(cohortCollectedAmount),
        pendingCollectionOrderCount: cohortPendingCollectionCount,
        pendingCollectionOperationalAmount: this.format(cohortPendingCollectionAmount),
        issuedOrderCount: cohortIssuedCount,
        issuedOrderOperationalAmount: this.format(cohortIssuedOperationalAmount),
        issuedSimulationSubtotal: this.format(cohortIssuedSubtotal),
        issuedSimulationTax: this.format(cohortIssuedTax),
        issuedSimulationTotal: this.format(cohortIssuedTotal),
        pendingToInvoiceCount: cohortPendingInvoiceCount,
        pendingToInvoiceOperationalAmount: this.format(cohortPendingInvoiceAmount),
        incompleteCostOrderCount: incompleteCostCount,
      },
      paymentPeriod: {
        collectedOrderCount: paidInPeriodCount,
        collectedOperationalAmount: this.format(paidInPeriodAmount),
      },
      issuancePeriod: {
        issuedSimulationCount: issuedInPeriodCount,
        simulatedSubtotal: this.format(issuedInPeriodSubtotal),
        simulatedTax: this.format(issuedInPeriodTax),
        simulatedTotal: this.format(issuedInPeriodTotal),
      },
      cancellationPeriod: {
        cancelledSimulationCount: cancelledInPeriodCount,
        cancelledSimulatedTotal: this.format(cancelledInPeriodTotal),
      },
      profitability: {
        generatedOperationalAmount: this.format(generatedAmount),
        knownDirectCost: this.format(knownDirectCost),
        provisionalGrossProfit: this.format(grossProfit),
        operatingExpenses: this.format(operatingExpenses),
        provisionalOperatingProfit: this.format(operatingProfit),
        incompleteCostOrderCount: incompleteCostCount,
      },
    };
  }

  private invoiceSelection(order: BillingReconciliationOrder): InvoiceSelection {
    const active = order.invoices.filter(({ status }) => status === 'draft' || status === 'issued');
    if (active.length > 1) {
      throw new BadRequestException(`La orden ${order.id} tiene más de una simulación activa`);
    }
    return {
      activeDraft: active[0]?.status === 'draft' ? active[0] : null,
      activeIssued: active[0]?.status === 'issued' ? active[0] : null,
    };
  }

  private inPeriod(value: ReconciliationTimestamp, startsAt: number, endsBefore: number): boolean {
    const timestamp = this.timestamp(value, 'fecha del indicador');
    return timestamp >= startsAt && timestamp < endsBefore;
  }

  private timestamp(value: ReconciliationTimestamp, label: string): number {
    const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
    if (!Number.isFinite(timestamp)) {
      throw new BadRequestException(`${label} debe contener una fecha válida`);
    }
    return timestamp;
  }

  private money(value: ReconciliationMoney, label: string): bigint {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        throw new BadRequestException(`${label} debe contener un importe no negativo`);
      }
      return BigInt(Math.round((value + Number.EPSILON) * 100));
    }
    const normalized = value.trim();
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
    if (!match) {
      throw new BadRequestException(`${label} debe contener un importe con hasta dos decimales`);
    }
    return BigInt(match[1]!) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  }

  private format(value: bigint): string {
    const sign = value < 0n ? '-' : '';
    const absolute = value < 0n ? -value : value;
    return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
  }
}
