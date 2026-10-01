export type PurchaseStatus = "draft" | "confirmed" | "cancelled";

export const PURCHASE_STATUS_NAMES: Record<PurchaseStatus, string> = {
  draft: "Borrador",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

export interface PurchaseSupplier {
  id: string;
  commercialName: string;
  isDefault: boolean;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  inventoryMovementId: string | null;
  inventoryLotId: string | null;
  position: number;
  productName: string;
  productSku: string | null;
  unitName: string;
  unitSymbol: string;
  quantity: string;
  unitCost: string;
  amount: string;
}

export interface PurchaseStatusHistory {
  id: string;
  previousStatus: PurchaseStatus | null;
  newStatus: PurchaseStatus;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface PurchaseSummary {
  id: string;
  folio: string;
  status: PurchaseStatus;
  supplier: PurchaseSupplier;
  purchasedAt: string;
  reference: string | null;
  notes: string | null;
  total: string;
  itemCount: number;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Purchase extends PurchaseSummary {
  items: PurchaseItem[];
  statusHistory: PurchaseStatusHistory[];
}

export interface PaginatedPurchases {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: PurchaseSummary[];
}

export interface PurchaseInput {
  supplierId?: string;
  purchasedAt?: string;
  reference?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
}
