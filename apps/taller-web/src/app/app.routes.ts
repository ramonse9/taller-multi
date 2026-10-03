import { Routes } from "@angular/router";
import {
  authGuard,
  featureGuard,
  guestGuard,
  homeGuard,
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
    path: "recuperar-contrasena",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/password-recovery.page").then(
        (m) => m.PasswordRecoveryPage,
      ),
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
        canActivate: [roleGuard, featureGuard],
        data: { roles: ["company_admin", "admin", "user"] },
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
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "customer_history",
        },
        loadComponent: () =>
          import("./features/clients/client-detail.page").then(
            (m) => m.ClientDetailPage,
          ),
      },
      {
        path: "clients",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "customer_history",
        },
        loadComponent: () =>
          import("./features/clients/clients.page").then((m) => m.ClientsPage),
      },
      {
        path: "orders/new",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
        },
        loadComponent: () =>
          import("./features/orders/order-wizard.page").then(
            (m) => m.OrderWizardPage,
          ),
      },
      {
        path: "orders/:id/edit",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
        },
        loadComponent: () =>
          import("./features/orders/order-wizard.page").then(
            (m) => m.OrderWizardPage,
          ),
      },
      {
        path: "orders/:id",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
        },
        loadComponent: () =>
          import("./features/orders/order-detail.page").then(
            (m) => m.OrderDetailPage,
          ),
      },
      {
        path: "orders",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "service_orders",
        },
        loadComponent: () =>
          import("./features/orders/orders.page").then((m) => m.OrdersPage),
      },
      {
        path: "concept-catalog",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "item_catalog",
        },
        loadComponent: () =>
          import("./features/concept-catalog/concept-catalog.page").then(
            (m) => m.ConceptCatalogPage,
          ),
      },
      {
        path: "inventory",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
        },
        loadComponent: () =>
          import("./features/inventory/inventory.page").then(
            (m) => m.InventoryPage,
          ),
      },
      {
        path: "purchases/new",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
        },
        loadComponent: () =>
          import("./features/purchases/purchase-wizard.page").then(
            (m) => m.PurchaseWizardPage,
          ),
      },
      {
        path: "purchases/:id/edit",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
        },
        loadComponent: () =>
          import("./features/purchases/purchase-wizard.page").then(
            (m) => m.PurchaseWizardPage,
          ),
      },
      {
        path: "purchases/:id",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
        },
        loadComponent: () =>
          import("./features/purchases/purchase-detail.page").then(
            (m) => m.PurchaseDetailPage,
          ),
      },
      {
        path: "purchases",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "inventory",
        },
        loadComponent: () =>
          import("./features/purchases/purchases.page").then(
            (m) => m.PurchasesPage,
          ),
      },
      {
        path: "suppliers",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "item_catalog",
        },
        loadComponent: () =>
          import("./features/suppliers/suppliers.page").then(
            (m) => m.SuppliersPage,
          ),
      },
      {
        path: "expenses",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "expenses",
        },
        loadComponent: () =>
          import("./features/expenses/expenses.page").then(
            (m) => m.ExpensesPage,
          ),
      },
      {
        path: "profitability",
        canActivate: [roleGuard, featureGuard],
        data: {
          roles: ["company_admin", "admin", "user"],
          feature: "profitability",
        },
        loadComponent: () =>
          import("./features/profitability/profitability.page").then(
            (m) => m.ProfitabilityPage,
          ),
      },
      {
        path: "vehicle-catalog",
        canActivate: [roleGuard, featureGuard],
        data: { roles: ["platform_admin", "company_admin"] },
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
        canActivate: [roleGuard, featureGuard],
        data: { roles: ["company_admin", "admin"] },
        loadComponent: () =>
          import("./features/users/users.page").then((m) => m.UsersPage),
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
