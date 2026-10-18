import { computed, inject, Injectable } from "@angular/core";
import { AuthService } from "../auth/auth.service";
import { UserRole } from "../auth/auth.models";
import {
  SubscriptionFeature,
  SubscriptionPlanCode,
} from "../subscriptions/subscription.models";

export interface TenantNavigationItem {
  label: string;
  description: string;
  link: string;
  permission?: string;
  permissions?: string[];
  feature?: SubscriptionFeature;
  roles?: UserRole[];
  hiddenForPlans?: SubscriptionPlanCode[];
  allowReadOnlyFeature?: boolean;
}

export const TENANT_NAVIGATION: readonly TenantNavigationItem[] = [
  {
    label: "Inicio",
    description: "Accesos principales del sistema.",
    link: "/home",
  },
  {
    label: "Tablero",
    description: "Indicadores, pendientes y actividad del taller.",
    link: "/dashboard",
    permission: "dashboard.view",
    feature: "dashboard",
  },
  {
    label: "Órdenes",
    description: "Consulta y administra las órdenes de servicio.",
    link: "/orders",
    permission: "orders.view",
    feature: "service_orders",
  },
  {
    label: "Clientes",
    description: "Historial de clientes, empresas y vehículos.",
    link: "/clients",
    permission: "clients.view",
    feature: "customer_history",
  },
  {
    label: "Productos y servicios",
    description: "Catálogo de conceptos disponibles para las órdenes.",
    link: "/concept-catalog",
    permission: "catalog.view",
    feature: "item_catalog",
  },
  {
    label: "Inventario",
    description: "Existencias, lotes y movimientos de productos.",
    link: "/inventory",
    permission: "inventory.view",
    feature: "inventory",
  },
  {
    label: "Compras",
    description: "Compras, entradas y costos de productos.",
    link: "/purchases",
    permissions: ["purchases.view", "catalog.view_costs"],
    feature: "purchases",
  },
  {
    label: "Proveedores",
    description: "Directorio de proveedores del taller.",
    link: "/suppliers",
    permission: "suppliers.view",
    feature: "suppliers",
  },
  {
    label: "Gastos",
    description: "Registro y seguimiento de gastos operativos.",
    link: "/expenses",
    permission: "expenses.view",
    feature: "expenses",
  },
  {
    label: "Utilidad",
    description: "Ingresos, costos, gastos y resultado del periodo.",
    link: "/profitability",
    permission: "profitability.view",
    feature: "profitability",
  },
  {
    label: "Facturación",
    description: "Documentos y preparación fiscal de la compañía.",
    link: "/invoices",
    permission: "invoices.view",
    feature: "invoicing",
    allowReadOnlyFeature: true,
  },
  {
    label: "Marcas y modelos",
    description: "Catálogo de marcas y modelos de vehículos.",
    link: "/vehicle-catalog",
    permission: "vehicle_catalog.view",
    feature: "vehicle_catalog",
    hiddenForPlans: ["essential"],
  },
  {
    label: "Usuarios",
    description: "Usuarios, roles y permisos de la compañía.",
    link: "/users",
    permission: "users.view",
    feature: "user_management",
    roles: ["company_admin", "admin"],
  },
  {
    label: "Seguridad",
    description: "Datos de la cuenta y cambio de contraseña.",
    link: "/account",
  },
];

@Injectable({ providedIn: "root" })
export class TenantNavigationService {
  private readonly auth = inject(AuthService);

  readonly items = computed(() => {
    const user = this.auth.user();
    if (!user || user.role === "platform_admin") return [];

    return TENANT_NAVIGATION.filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) return false;
      const planCode = user.subscription?.planCode;
      if (planCode && item.hiddenForPlans?.includes(planCode)) return false;
      if (
        item.feature &&
        !(item.allowReadOnlyFeature
          ? this.auth.hasFeatureReadAccess(item.feature)
          : this.auth.hasFeature(item.feature))
      )
        return false;
      if (item.permission && !this.auth.hasPermission(item.permission)) {
        return false;
      }
      return (item.permissions ?? []).every((permission) =>
        this.auth.hasPermission(permission),
      );
    });
  });
}
