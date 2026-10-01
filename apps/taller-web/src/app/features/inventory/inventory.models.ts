export type InventoryMovementType = "entry" | "exit" | "adjustment";

export interface InventoryProduct {
  id: string;
  sku: string | null;
  name: string;
  unitId: string;
  unitName: string;
  unitSymbol: string;
  allowsDecimals: boolean;
  stock: string;
  minimumStock: string;
  lastCost: string | null;
  averageCost: string | null;
  isLowStock: boolean;
  isActive: boolean;
}

export interface InventoryLot {
  id: string;
  productId: string;
  receivedQuantity: string;
  remainingQuantity: string;
  unitCost: string;
  receivedAt: string;
  sourceType:
    | "opening_balance"
    | "manual_entry"
    | "adjustment"
    | "purchase"
    | "order_return";
  sourceReference: string | null;
  entryMovementId: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  type: InventoryMovementType;
  quantity: string;
  previousStock: string;
  resultingStock: string;
  unitCost: string | null;
  reason: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface PaginatedInventoryProducts {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: InventoryProduct[];
}

export interface PaginatedInventoryMovements {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: InventoryMovement[];
}

export interface InventoryMovementInput {
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCost?: number | null;
  reason: string;
}
