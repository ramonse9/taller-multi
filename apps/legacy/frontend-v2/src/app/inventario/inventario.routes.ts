import { Routes } from '@angular/router';
import { hasRoleGuard } from '@auth/guards/has-role.guard';
import { EnumMenuOption, EnumRole } from '@shared/enums/general-estatus.enum';

export const inventarioRoutes: Routes = [
  {
    path: '',
    redirectTo: 'compras',
    pathMatch: 'full'
  },
  {
    path: 'compras',
    loadComponent: () => import('./pages/compras-page/compras-page.component'),
    data: { menu: EnumMenuOption.INVENTARIO }
  },
  {
    path: 'compras/:id',
    loadComponent: () => import('./pages/compra-page/compra-page.component'),
    data: { menu: EnumMenuOption.INVENTARIO }
  },
  {
    path: 'compras/:id/:modo',
    loadComponent: () => import('./pages/compra-page/compra-page.component'),
    data: { menu: EnumMenuOption.INVENTARIO }
  },
  {
    path: 'productos',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.INVENTARIO },
    loadComponent: () => import('../inventario/pages/productos-page/productos-page.component'),
  },
  {
    path: 'productos/:id',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.INVENTARIO },
    loadComponent: () => import('../inventario/pages/producto-page/producto-page.component'),
  },
  {
    path: 'movimientos',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.INVENTARIO },
    loadComponent: () => import('./pages/inventario-movimientos-page/inventario-movimientos-page.component'),
  },
  {
    path: 'lotes',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.INVENTARIO },
    loadComponent: () => import('./pages/inventario-lotes-page/inventario-lotes-page.component'),
  },
  {
    path: 'proveedores',
    loadComponent: () => import('../inventario/pages/proveedores-page/proveedores-page.component'),
    data: { menu: EnumMenuOption.INVENTARIO }
  },
  {
    path: 'proveedores/:id',
    loadComponent: () => import('../inventario/pages/proveedor-page/proveedor-page.component'),
    data: { menu: EnumMenuOption.INVENTARIO }
  },


]

export default inventarioRoutes;
