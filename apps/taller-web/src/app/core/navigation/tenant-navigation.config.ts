import type { UserRole } from "../auth/auth.models";
import type {
  SubscriptionFeature,
  SubscriptionPlanCode,
} from "../subscriptions/subscription.models";

export type NavigationIconName =
  | "home"
  | "dashboard"
  | "orders"
  | "clients"
  | "catalog"
  | "inventory"
  | "purchases"
  | "suppliers"
  | "expenses"
  | "profitability"
  | "invoices"
  | "vehicles"
  | "users"
  | "security";

export type HomeModuleGroup = "main" | "management";
export type HomeActionTone = "orange" | "blue" | "green" | "violet";

export interface TenantAccessRule {
  permission?: string;
  permissions?: string[];
  feature?: SubscriptionFeature;
  roles?: UserRole[];
  hiddenForPlans?: SubscriptionPlanCode[];
  allowReadOnlyFeature?: boolean;
}

export interface TenantNavigationItem extends TenantAccessRule {
  label: string;
  description: string;
  link: string;
  icon: NavigationIconName;
  homeGroup?: HomeModuleGroup;
}

export interface TenantHomeAction extends TenantAccessRule {
  label: string;
  description: string;
  link: string;
  queryParams?: Readonly<Record<string, string>>;
  icon: NavigationIconName;
  tone: HomeActionTone;
}

export interface TenantAccessContext {
  role: UserRole;
  planCode: SubscriptionPlanCode | null;
  subscriptionUsable: boolean;
  features: readonly SubscriptionFeature[];
  readOnlyFeatures: readonly SubscriptionFeature[];
  permissions: readonly string[];
}

export const TENANT_NAVIGATION: readonly TenantNavigationItem[] = [
  {
    label: "Inicio",
    description: "Accesos principales del sistema.",
    link: "/home",
    icon: "home",
  },
  {
    label: "Tablero",
    description: "Indicadores, pendientes y actividad del taller.",
    link: "/dashboard",
    icon: "dashboard",
    homeGroup: "main",
    permission: "dashboard.view",
    feature: "dashboard",
  },
  {
    label: "Órdenes",
    description: "Consulta y administra las órdenes de servicio.",
    link: "/orders",
    icon: "orders",
    homeGroup: "main",
    permission: "orders.view",
    feature: "service_orders",
  },
  {
    label: "Clientes",
    description: "Historial de clientes, empresas y vehículos.",
    link: "/clients",
    icon: "clients",
    homeGroup: "main",
    permission: "clients.view",
    feature: "customer_history",
  },
  {
    label: "Productos y servicios",
    description: "Catálogo de conceptos disponibles para las órdenes.",
    link: "/concept-catalog",
    icon: "catalog",
    homeGroup: "main",
    permission: "catalog.view",
    feature: "item_catalog",
  },
  {
    label: "Inventario",
    description: "Existencias, lotes y movimientos de productos.",
    link: "/inventory",
    icon: "inventory",
    homeGroup: "main",
    permission: "inventory.view",
    feature: "inventory",
  },
  {
    label: "Compras",
    description: "Compras, entradas y costos de productos.",
    link: "/purchases",
    icon: "purchases",
    homeGroup: "main",
    permissions: ["purchases.view", "catalog.view_costs"],
    feature: "purchases",
  },
  {
    label: "Proveedores",
    description: "Directorio de proveedores del taller.",
    link: "/suppliers",
    icon: "suppliers",
    homeGroup: "management",
    permission: "suppliers.view",
    feature: "suppliers",
  },
  {
    label: "Gastos",
    description: "Registro y seguimiento de gastos operativos.",
    link: "/expenses",
    icon: "expenses",
    homeGroup: "main",
    permission: "expenses.view",
    feature: "expenses",
  },
  {
    label: "Utilidad",
    description: "Ingresos, costos, gastos y resultado del periodo.",
    link: "/profitability",
    icon: "profitability",
    homeGroup: "main",
    permission: "profitability.view",
    feature: "profitability",
  },
  {
    label: "Facturación",
    description: "Documentos y preparación fiscal de la compañía.",
    link: "/invoices",
    icon: "invoices",
    homeGroup: "main",
    permission: "invoices.view",
    feature: "invoicing",
    allowReadOnlyFeature: true,
  },
  {
    label: "Marcas y modelos",
    description: "Catálogo de marcas y modelos de vehículos.",
    link: "/vehicle-catalog",
    icon: "vehicles",
    homeGroup: "management",
    permission: "vehicle_catalog.view",
    feature: "vehicle_catalog",
    hiddenForPlans: ["essential"],
  },
  {
    label: "Usuarios",
    description: "Usuarios, roles y permisos de la compañía.",
    link: "/users",
    icon: "users",
    homeGroup: "management",
    permission: "users.view",
    feature: "user_management",
    roles: ["company_admin", "admin"],
  },
  {
    label: "Seguridad",
    description: "Datos de la cuenta y cambio de contraseña.",
    link: "/account",
    icon: "security",
    homeGroup: "management",
  },
];

export const TENANT_HOME_ACTIONS: readonly TenantHomeAction[] = [
  {
    label: "Nueva orden",
    description: "Registra un servicio para un cliente y su vehículo.",
    link: "/orders/new",
    icon: "orders",
    tone: "orange",
    feature: "service_orders",
    permissions: [
      "orders.create",
      "clients.view",
      "vehicles.view",
      "vehicle_catalog.view",
    ],
  },
  {
    label: "Nuevo cliente",
    description: "Agrega una persona o empresa al historial del taller.",
    link: "/clients",
    queryParams: { new: "true" },
    icon: "clients",
    tone: "blue",
    feature: "customer_history",
    permissions: ["clients.view", "clients.create"],
  },
  {
    label: "Nuevo gasto",
    description: "Captura un gasto operativo sin salir del flujo diario.",
    link: "/expenses",
    queryParams: { new: "true" },
    icon: "expenses",
    tone: "green",
    feature: "expenses",
    permissions: ["expenses.view", "expenses.create"],
  },
  {
    label: "Nueva compra",
    description: "Registra productos, costos y entradas de inventario.",
    link: "/purchases/new",
    icon: "purchases",
    tone: "violet",
    feature: "purchases",
    permissions: [
      "purchases.create",
      "catalog.view",
      "catalog.view_costs",
      "suppliers.view",
    ],
  },
];

export function isTenantAccessAllowed(
  rule: TenantAccessRule,
  context: TenantAccessContext,
): boolean {
  if (context.role === "platform_admin") return false;
  if (rule.roles && !rule.roles.includes(context.role)) return false;
  if (context.planCode && rule.hiddenForPlans?.includes(context.planCode))
    return false;
  if (rule.feature) {
    if (!context.subscriptionUsable) return false;
    const hasFeature = context.features.includes(rule.feature);
    const hasReadOnlyFeature =
      rule.allowReadOnlyFeature &&
      context.readOnlyFeatures.includes(rule.feature);
    if (!hasFeature && !hasReadOnlyFeature) return false;
  }

  const hasPermission = (permission: string) =>
    context.role === "company_admin" ||
    context.permissions.includes(permission);
  if (rule.permission && !hasPermission(rule.permission)) return false;
  return (rule.permissions ?? []).every(hasPermission);
}
