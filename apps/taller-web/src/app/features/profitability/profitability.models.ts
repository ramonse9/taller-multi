export interface ProfitabilityTotals {
  completedOrderCount: number;
  incompleteOrderCount: number;
  paidCompletedOrderCount: number;
  unpaidCompletedOrderCount: number;
  income: string;
  collectedIncome: string;
  outstandingIncome: string;
  directCost: string;
  fifoProductCost: string;
  grossProfit: string;
  collectedGrossProfit: string;
  operatingExpenses: string;
  netProfit: string;
  collectedNetResult: string;
  grossMarginPercent: string | null;
  netMarginPercent: string | null;
  isComplete: boolean;
}

export interface ProfitabilityPeriodRow {
  period: string;
  completedOrderCount: number;
  income: string;
  collectedIncome: string;
  outstandingIncome: string;
  directCost: string;
  grossProfit: string;
  operatingExpenses: string;
  netProfit: string;
  collectedNetResult: string;
}

export interface ProfitabilityCustomerRow {
  customerId: string;
  customerName: string;
  customerType: "person" | "company";
  completedOrderCount: number;
  income: string;
  collectedIncome: string;
  outstandingIncome: string;
  directCost: string;
  grossProfit: string;
}

export interface ProfitabilityServiceTypeRow {
  type: "service" | "product" | "free";
  name: string;
  itemCount: number;
  income: string;
  directCost: string;
  grossProfit: string;
}

export interface ProfitabilityOrderRow {
  id: string;
  folio: string;
  customerId: string;
  customerName: string;
  completedAt: string;
  income: string | null;
  directCost: string | null;
  fifoProductCost: string;
  grossProfit: string | null;
  isComplete: boolean;
  isPaid: boolean;
}

export interface ProfitabilityReport {
  occurredFrom: string;
  occurredTo: string;
  totals: ProfitabilityTotals;
  byDay: ProfitabilityPeriodRow[];
  byMonth: ProfitabilityPeriodRow[];
  byCustomer: ProfitabilityCustomerRow[];
  byServiceType: ProfitabilityServiceTypeRow[];
  orders: ProfitabilityOrderRow[];
}
