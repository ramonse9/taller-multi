import { Routes } from '@angular/router';
import { NotAuthenticatedGuard } from './auth/guards/not-authenticated.guard';

import { Error404Component } from './error/pages/error-404/error-404.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { IsAuthenticatedGuard } from '@auth/guards/is-authenticated.guard';
import { hasRoleGuard } from '@auth/guards/has-role.guard';
import { EnumRole } from '@shared/enums/general-estatus.enum';

export const routes: Routes = [
  {
    path: '',
    canMatch: [NotAuthenticatedGuard],
    loadChildren: () => import('./auth/auth.routes')
  },
  {
    path: '',
    canMatch: [IsAuthenticatedGuard],
    component: MainLayoutComponent,
    children: [
      /*{
        path: '', redirectTo: 'inicio', pathMatch: 'full',
        canActivate: [hasRoleGuard],
        data: {allowedRoles: ['user', 'admin', 'super']},
        loadChildren: () => import('./inicio/inicio.routes'),
      },*/
      {
        path: '', redirectTo: 'inicio', pathMatch: 'full'
      },
      {
        path: 'inicio',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.CAPTURISTA]},
        loadChildren: () => import('./inicio/inicio.routes'),
      },
      {
        path: 'catalogos',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.CAPTURISTA]},
        loadChildren: () => import('./catalogos/catalogos.routes'),
      },
      {
        path: 'dashboard',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.ADMIN]},
        loadChildren: () => import('./dashboard/dashboard.routes'),
      },
      {
        path: 'operaciones',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.CAPTURISTA]},
        loadChildren: () => import('./operaciones/operaciones.routes'),
      },
      {
        path: 'inventario',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.ADMIN]},
        loadChildren: () => import('./inventario/inventario.routes'),
      },
      {
        path: 'pagos',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.ADMIN]},
        loadChildren: () => import('./pagos/pagos.routes'),
      },
      {
        path: 'facturas',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.ADMIN]},
        loadChildren: () => import('./facturas/facturas.routes'),
      },
      {
        path: 'account',
        canActivate: [hasRoleGuard],
        data: {role: [ EnumRole.CAPTURISTA]},
        loadChildren: () => import('./account/account.routes'),
      },
    ]
  },
  {
    path: 'error',
    loadChildren: () => import('./error/error.routes')
  },
  {
    path: '**',
    redirectTo: 'error/404'
  }

]
