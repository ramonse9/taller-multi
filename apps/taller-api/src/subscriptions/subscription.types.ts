export const SUBSCRIPTION_PLAN_CODES = ['basic', 'control', 'invoicing'] as const;
export type SubscriptionPlanCode = (typeof SUBSCRIPTION_PLAN_CODES)[number];

export const SUBSCRIPTION_STATUSES = ['active', 'past_due', 'suspended', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_FEATURES = [
  'customer_history',
  'vehicle_history',
  'service_orders',
  'free_order_items',
  'item_catalog',
  'inventory',
  'expenses',
  'profitability',
  'invoicing',
] as const;
export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[number];

export const SUBSCRIPTION_LIMITS = ['max_users', 'max_branches', 'max_monthly_invoices'] as const;
export type SubscriptionLimit = (typeof SUBSCRIPTION_LIMITS)[number];

export interface SubscriptionSummary {
  companyId: string;
  planCode: SubscriptionPlanCode;
  planName: string;
  status: SubscriptionStatus;
  usable: boolean;
  features: SubscriptionFeature[];
  limits: Record<SubscriptionLimit, number | null>;
}
