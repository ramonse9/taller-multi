export type DashboardOrderStatus = "in_progress" | "completed" | "cancelled";
export type DashboardRecordStatus = "draft" | "confirmed" | "cancelled";
export type DashboardMovementType = "entry" | "exit" | "adjustment";

export interface DashboardLowStockProduct {
  id: string;
  sku: string | null;
  name: string;
  unitSymbol: string;
  stock: string;
  minimumStock: string;
}

export interface DashboardLowStock {
  totalProducts: number;
  products: DashboardLowStockProduct[];
}

export interface DashboardSummary {
  period: { month: string; startsOn: string; endsOn: string };
  access: {
    planCode: "basic" | "control" | "invoicing";
    planName: string;
    includesFinancials: boolean;
    includesLowStock: boolean;
  };
  orders: {
    inProgressCount: number;
    unpaidCount: number;
    completedUnpaidCount: number;
    completedPaidCount: number;
  };
  revenue: {
    generated: string;
    collected: string;
    outstanding: string;
    receivable: string;
  };
  financials: {
    directCost: string;
    grossProfit: string;
    operatingExpenses: string;
    operatingProfit: string;
    incompleteOrderCount: number;
    missingPriceOrderCount: number;
    missingProductCostOrderCount: number;
    isComplete: boolean;
  } | null;
  lowStock: DashboardLowStock | null;
}

export interface DashboardOrderActivity {
  id: string;
  folio: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  brandName: string;
  modelName: string;
  status: DashboardOrderStatus;
  isPaid: boolean;
  total: string | null;
  updatedAt: string;
}

export interface DashboardOldOrder extends DashboardOrderActivity {
  openedAt: string;
  daysOpen: number;
}

export interface DashboardReceivable {
  id: string;
  folio: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  brandName: string;
  modelName: string;
  status: "in_progress" | "completed";
  total: string | null;
  openedAt: string;
  completedAt: string | null;
}

export interface DashboardPurchaseActivity {
  id: string;
  folio: string;
  supplierId: string;
  supplierName: string;
  status: DashboardRecordStatus;
  total: string;
  itemCount: number;
  purchasedAt: string;
  updatedAt: string;
}

export interface DashboardExpenseActivity {
  id: string;
  description: string;
  categoryName: string;
  supplierName: string;
  status: DashboardRecordStatus;
  amount: string;
  occurredOn: string;
  updatedAt: string;
}

export interface DashboardInventoryMovementActivity {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  type: DashboardMovementType;
  quantity: string;
  resultingStock: string;
  reason: string;
  createdAt: string;
}

export interface DashboardActivity {
  recentOrders: DashboardOrderActivity[];
  oldestInProgress: DashboardOldOrder[];
  pendingCollection: DashboardReceivable[];
  recentPurchases: DashboardPurchaseActivity[] | null;
  recentExpenses: DashboardExpenseActivity[] | null;
  recentInventoryMovements: DashboardInventoryMovementActivity[] | null;
  lowStock: DashboardLowStock | null;
}
