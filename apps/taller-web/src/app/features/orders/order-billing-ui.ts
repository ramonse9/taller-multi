import type { OrderBillingStatus, OrderSummary } from "./order.models";

const ORDER_BILLING_STATUS_LABELS: Record<OrderBillingStatus, string> = {
  not_invoiced: "Sin factura",
  draft: "Borrador",
  issued: "Simulación emitida",
  cancelled: "Simulación cancelada",
  discarded: "Sin factura",
};

export interface OrderBillingAccess {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
}

export interface OrderBillingAction {
  label: string;
  link: readonly string[];
  queryParams: Readonly<Record<string, string>> | null;
}

export function orderBillingStatusName(status: OrderBillingStatus): string {
  return ORDER_BILLING_STATUS_LABELS[status];
}

export function orderBillingAction(
  order: OrderSummary,
  access: OrderBillingAccess,
): OrderBillingAction | null {
  if (order.status !== "completed" || !access.canView) return null;

  if (order.activeInvoiceId && order.billingStatus === "draft") {
    return {
      label: access.canEdit ? "Continuar borrador" : "Ver borrador",
      link: ["/invoices", order.activeInvoiceId],
      queryParams: null,
    };
  }

  if (order.activeInvoiceId && order.billingStatus === "issued") {
    return {
      label: "Ver simulación",
      link: ["/invoices", order.activeInvoiceId],
      queryParams: null,
    };
  }

  if (!access.canCreate) return null;
  return {
    label:
      order.billingStatus === "cancelled"
        ? "Preparar nueva simulación"
        : "Preparar factura simulada",
    link: ["/invoices"],
    queryParams: { orderId: order.id },
  };
}
