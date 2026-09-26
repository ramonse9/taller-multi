import { Routes } from '@angular/router';
import { hasRoleGuard } from '@auth/guards/has-role.guard';
import { EnumMenuOption, EnumRole } from '@shared/enums/general-estatus.enum';

export const operacionesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'ordenes',
    pathMatch: 'full'
  },
  {
    path: 'ordenes',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/ordenes-page/ordenes-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'ordenesnew',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/ordenes-page-new/ordenes-page-new.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'ordenes/:id',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/orden-page/orden-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'ordenes/:id/:modo',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/orden-page/orden-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'cotizaciones',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/cotizaciones-page/cotizaciones-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'cotizaciones/:id',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/cotizacion-page/cotizacion-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },
  {
    path: 'cotizaciones/:id/:modo',
    canActivate: [hasRoleGuard],
    loadComponent: () => import('./pages/cotizacion-page/cotizacion-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.OPERACIONES }
  },

]

export default operacionesRoutes;
