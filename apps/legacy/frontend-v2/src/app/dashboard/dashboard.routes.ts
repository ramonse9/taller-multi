import { Routes } from '@angular/router';
import { EnumMenuOption } from '@shared/enums/general-estatus.enum';

export const dashboardRoutes: Routes = [
  {
    path: '',
    redirectTo: 'general',
    pathMatch: 'full'
  },
  {
    path: 'general',
    loadComponent: () => import('./pages/dashboard-page/dashboard-general-page.component'),
    data: { menu: EnumMenuOption.DASHBOARD }

  },
]

export default dashboardRoutes;
