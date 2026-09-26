import { Routes } from '@angular/router';

export const accountRoutes: Routes = [
  {
    path: '',
    redirectTo: 'change-password',
    pathMatch: 'full'
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/pass-change-page/pass-change-page.component')
  },
]

export default accountRoutes;
