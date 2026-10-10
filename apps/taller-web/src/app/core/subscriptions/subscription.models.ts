export type SubscriptionPlanCode = "basic" | "control" | "invoicing";
export type SubscriptionStatus =
  "active" | "past_due" | "suspended" | "canceled";
export type SubscriptionFeature =
  | "customer_history"
  | "vehicle_history"
  | "service_orders"
  | "free_order_items"
  | "item_catalog"
  | "inventory"
  | "expenses"
  | "profitability"
  | "invoicing";

export interface SubscriptionLimits {
  max_users: number | null;
  max_branches: number | null;
  max_monthly_invoices: number | null;
}

export interface SubscriptionPlan {
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  sortOrder: number;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
}

export interface SubscriptionSummary {
  companyId: string;
  planCode: SubscriptionPlanCode;
  planName: string;
  status: SubscriptionStatus;
  usable: boolean;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
}

export interface CompanySubscription extends SubscriptionSummary {
  companyName: string;
  companyLoginCode: string;
}

export interface ChangeSubscriptionInput {
  planCode: SubscriptionPlanCode;
  status: SubscriptionStatus;
  reason?: string;
}
