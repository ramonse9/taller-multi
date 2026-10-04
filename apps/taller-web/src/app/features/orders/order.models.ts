import { CustomerType } from "../clients/client.models";

export type OrderStatus = "in_progress" | "completed" | "cancelled";
export type OrderItemKind = "product" | "service";

export interface OrderCustomer {
  id: string;
  type: CustomerType;
  displayName: string;
}

export interface OrderVehicle {
  id: string;
  brandName: string;
  modelName: string;
  year: number;
  color: string;
  numeroSerie: string | null;
  licensePlate: string | null;
}

export interface OrderItem {
  id: string;
  productServiceId: string | null;
  kind: OrderItemKind;
  position: number;
  description: string;
  unitName: string;
  unitSymbol: string;
  quantity: string;
  unitPrice: string | null;
  amount: string | null;
  unitCost: string | null;
  costAmount: string | null;
  tracksInventory: boolean;
  costLayers: OrderItemCostLayer[];
}

export interface OrderItemCostLayer {
  lotId: string;
  quantity: string;
  unitCost: string;
  costAmount: string;
}

export interface OrderNote {
  id: string;
  body: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedByUserId: string;
  changedByName: string;
  changedAt: string;
}

export interface OrderSummary {
  id: string;
  folio: string;
  status: OrderStatus;
  customer: OrderCustomer;
  vehicle: OrderVehicle;
  subtotal: string | null;
  total: string | null;
  totalCost: string | null;
  grossProfit: string | null;
  inventoryAppliedAt: string | null;
  hasUnpricedItems: boolean;
  hasUnknownProductCosts: boolean;
  isFinanciallyComplete: boolean;
  isPaid: boolean;
  openedAt: string;
  closedAt: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItem extends OrderSummary {
  itemCount: number;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
  notes: OrderNote[];
  statusHistory: OrderStatusHistory[];
}

export interface PaginatedOrders {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  items: OrderListItem[];
}

export interface OrderItemInput {
  itemId?: string;
  productServiceId?: string | null;
  kind?: OrderItemKind;
  description: string;
  quantity: number;
  unitPrice?: number | null;
  unitCost?: number | null;
}

export interface OrderInput {
  customerId: string;
  vehicleId: string;
  items: OrderItemInput[];
}

export interface OrderListOptions {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus | "";
  customerId?: string;
  vehicleId?: string;
  isPaid?: boolean | "";
}

export const ORDER_STATUS_NAMES: Record<OrderStatus, string> = {
  in_progress: "En proceso",
  completed: "Terminada",
  cancelled: "Cancelada",
};
