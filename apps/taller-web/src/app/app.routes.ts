import { Routes } from "@angular/router";
import {
  authGuard,
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
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "user"] },
        loadComponent: () =>
          import("./features/clients/client-detail.page").then(
            (m) => m.ClientDetailPage,
          ),
      },
      {
        path: "clients",
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "user"] },
        loadComponent: () =>
          import("./features/clients/clients.page").then((m) => m.ClientsPage),
      },
      {
        path: "vehicle-catalog",
        canActivate: [roleGuard],
        data: { roles: ["platform_admin", "company_admin"] },
        loadComponent: () =>
          import("./features/vehicle-catalog/vehicle-catalog.page").then(
            (m) => m.VehicleCatalogPage,
          ),
      },
      {
        path: "users",
        canActivate: [roleGuard],
        data: { roles: ["company_admin"] },
        loadComponent: () =>
          import("./features/users/users.page").then((m) => m.UsersPage),
      },
      {
        path: "account",
        canActivate: [roleGuard],
        data: { roles: ["company_admin", "user"] },
        loadComponent: () =>
          import("./features/account/account.page").then((m) => m.AccountPage),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
