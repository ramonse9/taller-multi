import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../auth/auth.service";
import { UserRole } from "../auth/auth.models";
import { SubscriptionFeature } from "../subscriptions/subscription.models";
import { ThemeService } from "../theme/theme.service";

interface TenantNavigationItem {
  label: string;
  link: string;
  permission?: string;
  permissions?: string[];
  feature?: SubscriptionFeature;
  roles?: UserRole[];
}

const TENANT_NAVIGATION: TenantNavigationItem[] = [
  { label: "Tablero", link: "/dashboard", permission: "dashboard.view" },
  {
    label: "Órdenes",
    link: "/orders",
    permission: "orders.view",
    feature: "service_orders",
  },
  {
    label: "Clientes",
    link: "/clients",
    permission: "clients.view",
    feature: "customer_history",
  },
  {
    label: "Productos y servicios",
    link: "/concept-catalog",
    permission: "catalog.view",
    feature: "item_catalog",
  },
  {
    label: "Inventario",
    link: "/inventory",
    permission: "inventory.view",
    feature: "inventory",
  },
  {
    label: "Compras",
    link: "/purchases",
    permissions: ["purchases.view", "catalog.view_costs"],
    feature: "inventory",
  },
  {
    label: "Proveedores",
    link: "/suppliers",
    permission: "suppliers.view",
    feature: "item_catalog",
  },
  {
    label: "Gastos",
    link: "/expenses",
    permission: "expenses.view",
    feature: "expenses",
  },
  {
    label: "Utilidad",
    link: "/profitability",
    permission: "profitability.view",
    feature: "profitability",
  },
  {
    label: "Marcas y modelos",
    link: "/vehicle-catalog",
    permission: "vehicle_catalog.view",
  },
  {
    label: "Usuarios",
    link: "/users",
    permission: "users.view",
    roles: ["company_admin", "admin"],
  },
  { label: "Seguridad", link: "/account" },
];

@Component({
  selector: "app-shell",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: "./app-shell.component.html",
  styleUrl: "./app-shell.component.css",
  host: { "[class.dark]": "theme.isDark()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly tenantNavigation = computed(() => {
    const user = this.auth.user();
    if (!user || user.role === "platform_admin") return [];
    return TENANT_NAVIGATION.filter((item) => {
      if (item.roles && !item.roles.includes(user.role)) return false;
      if (item.feature && !this.auth.hasFeature(item.feature)) return false;
      if (item.permission && !this.auth.hasPermission(item.permission)) {
        return false;
      }
      return (item.permissions ?? []).every((permission) =>
        this.auth.hasPermission(permission),
      );
    });
  });

  companyName(): string {
    return this.auth.user()?.companyName ?? "Taller Multi";
  }

  companyInitials(): string {
    const initials = this.companyName()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => Array.from(part)[0]?.toLocaleUpperCase("es-MX") ?? "")
      .join("");
    return initials || "TM";
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  roleName(): string {
    switch (this.auth.user()?.role) {
      case "platform_admin":
        return "Plataforma";
      case "company_admin":
        return "Administrador principal";
      case "admin":
        return "Administrador";
      default:
        return "Usuario";
    }
  }
}
