import { CustomerType } from "../clients/client.models";

export type OrderStatus = "in_progress" | "completed" | "cancelled";

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
  position: number;
  description: string;
  quantity: string;
  unitPrice: string | null;
  amount: string | null;
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
  hasUnpricedItems: boolean;
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
  description: string;
  quantity: number;
  unitPrice?: number | null;
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
}

export const ORDER_STATUS_NAMES: Record<OrderStatus, string> = {
  in_progress: "En proceso",
  completed: "Terminada",
  cancelled: "Cancelada",
};
