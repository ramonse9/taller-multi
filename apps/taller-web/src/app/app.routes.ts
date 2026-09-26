import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage) },
  { path: 'clients', canActivate: [authGuard], loadComponent: () => import('./features/clients/clients.page').then((m) => m.ClientsPage) },
  { path: '', pathMatch: 'full', redirectTo: 'clients' },
  { path: '**', redirectTo: 'clients' },
];
