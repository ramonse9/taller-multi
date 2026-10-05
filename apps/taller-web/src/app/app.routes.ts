import { Routes } from "@angular/router";
import {
  authGuard,
  featureGuard,
  guestGuard,
  homeGuard,
  permissionGuard,
  roleGuard,
} from "./core/auth/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/login.page").then((m) => m.LoginPage),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./core/layout/app-shell.component").then(
        (m) => m.AppShellComponent,
      ),
    children: [
      { path: "", pathMatch: "full", canActivate: [homeGuard], children: [] },
      {
        path: "dashboard",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          permission: "dashboard.view",
        },
        loadComponent: () =>
          import("./features/dashboard/dashboard.page").then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: "companies",
        canActivate: [roleGuard],
        data: { roles: ["platform_admin"] },
        loadComponent: () =>
          import("./features/companies/companies.page").then(
            (m) => m.CompaniesPage,
          ),
      },
      {
        path: "clients/:id",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "customer_history",
          permission: ["clients.view", "vehicles.view", "vehicle_catalog.view"],
        },
        loadComponent: () =>
          import("./features/clients/client-detail.page").then(
            (m) => m.ClientDetailPage,
          ),
      },
      {
        path: "clients",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "customer_history",
          permission: "clients.view",
        },
        loadComponent: () =>
          import("./features/clients/clients.page").then((m) => m.ClientsPage),
      },
      {
        path: "orders/new",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
          permission: [
            "orders.create",
            "clients.view",
            "vehicles.view",
            "vehicle_catalog.view",
          ],
        },
        loadComponent: () =>
          import("./features/orders/order-wizard.page").then(
            (m) => m.OrderWizardPage,
          ),
      },
      {
        path: "orders/:id/edit",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
          permission: [
            "orders.view",
            "orders.edit",
            "clients.view",
            "vehicles.view",
            "vehicle_catalog.view",
          ],
        },
        loadComponent: () =>
          import("./features/orders/order-wizard.page").then(
            (m) => m.OrderWizardPage,
          ),
      },
      {
        path: "orders/:id",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
          permission: "orders.view",
        },
        loadComponent: () =>
          import("./features/orders/order-detail.page").then(
            (m) => m.OrderDetailPage,
          ),
      },
      {
        path: "orders",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
          permission: "orders.view",
        },
        loadComponent: () =>
          import("./features/orders/orders.page").then((m) => m.OrdersPage),
      },
      {
        path: "concept-catalog",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "item_catalog",
          permission: "catalog.view",
        },
        loadComponent: () =>
          import("./features/concept-catalog/concept-catalog.page").then(
            (m) => m.ConceptCatalogPage,
          ),
      },
      {
        path: "inventory",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
          permission: "inventory.view",
        },
        loadComponent: () =>
          import("./features/inventory/inventory.page").then(
            (m) => m.InventoryPage,
          ),
      },
      {
        path: "purchases/new",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
          permission: [
            "purchases.create",
            "catalog.view",
            "catalog.view_costs",
            "suppliers.view",
          ],
        },
        loadComponent: () =>
          import("./features/purchases/purchase-wizard.page").then(
            (m) => m.PurchaseWizardPage,
          ),
      },
      {
        path: "purchases/:id/edit",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
          permission: [
            "purchases.view",
            "purchases.edit",
            "catalog.view",
            "catalog.view_costs",
            "suppliers.view",
          ],
        },
        loadComponent: () =>
          import("./features/purchases/purchase-wizard.page").then(
            (m) => m.PurchaseWizardPage,
          ),
      },
      {
        path: "purchases/:id",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
          permission: ["purchases.view", "catalog.view_costs"],
        },
        loadComponent: () =>
          import("./features/purchases/purchase-detail.page").then(
            (m) => m.PurchaseDetailPage,
          ),
      },
      {
        path: "purchases",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
          permission: ["purchases.view", "catalog.view_costs"],
        },
        loadComponent: () =>
          import("./features/purchases/purchases.page").then(
            (m) => m.PurchasesPage,
          ),
      },
      {
        path: "suppliers",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "item_catalog",
          permission: "suppliers.view",
        },
        loadComponent: () =>
          import("./features/suppliers/suppliers.page").then(
            (m) => m.SuppliersPage,
          ),
      },
      {
        path: "expenses",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "expenses",
          permission: "expenses.view",
        },
        loadComponent: () =>
          import("./features/expenses/expenses.page").then(
            (m) => m.ExpensesPage,
          ),
      },
      {
        path: "profitability",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "profitability",
          permission: "profitability.view",
        },
        loadComponent: () =>
          import("./features/profitability/profitability.page").then(
            (m) => m.ProfitabilityPage,
          ),
      },
      {
        path: "vehicle-catalog",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: {
          roles: ["platform_admin", "company_admin", "admin", "user"],
          permission: "vehicle_catalog.view",
        },
        loadComponent: () =>
          import("./features/vehicle-catalog/vehicle-catalog.page").then(
            (m) => m.VehicleCatalogPage,
          ),
      },
      {
        path: "subscriptions",
        canActivate: [roleGuard],
        data: { roles: ["platform_admin"] },
        loadComponent: () =>
          import("./features/subscriptions/subscriptions.page").then(
            (m) => m.SubscriptionsPage,
          ),
      },
      {
        path: "subscription-required",
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "admin", "user"] },
        loadComponent: () =>
          import("./features/subscriptions/subscription-required.page").then(
            (m) => m.SubscriptionRequiredPage,
          ),
      },
      {
        path: "users",
        canActivate: [roleGuard, featureGuard, permissionGuard],
        data: { roles: ["company_admin", "admin"], permission: "users.view" },
        loadComponent: () =>
          import("./features/users/users.page").then((m) => m.UsersPage),
      },
      {
        path: "access-denied",
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "admin", "user"] },
        loadComponent: () =>
          import("./features/auth/access-denied.page").then(
            (m) => m.AccessDeniedPage,
          ),
      },
      {
        path: "account",
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "admin", "user"] },
        loadComponent: () =>
          import("./features/account/account.page").then((m) => m.AccountPage),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
