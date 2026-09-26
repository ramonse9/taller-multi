import { Routes } from "@angular/router";
import { hasRoleGuard } from "@auth/guards/has-role.guard";
import { EnumMenuOption, EnumRole } from "@shared/enums/general-estatus.enum";

export const catalogosRoutes: Routes = [
  {
    path:'marcas',
    data: { menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/marcas-page/marcas-page.component')
  },
  {
    path: 'marcas/:id',
    data: { menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/marca-page/marca-page.component')
  },
  {
    path:'modelos',
    data: { menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/modelos-page/modelos-page.component')
  },
  {
    path: 'modelos/:id',
    data: { menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/modelo-page/modelo-page.component')
  },
  /*
  {
    path:'gastosconceptos',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/gastos-page/gastos-page.component')
  },*/
  {
    path:'gastos',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/gastos-page/gastos-page.component')
  },
  {
    path: 'gastosconceptos/:id',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/gasto-concepto-page/gasto-concepto-page.component'),
  },
  {
    path: 'productosservicios',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/productos-servicios-page/productos-servicios-page.component'),
  },
  {
    path: 'productosservicios/:id',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/producto-servicio-page/producto-servicio-page.component'),
  },
  {
    path: 'servicios',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/servicios-page/servicios-page.component'),
  },
  {
    path: 'servicios/:id',
    canActivate: [hasRoleGuard],
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
    loadComponent: () => import('./pages/servicio-page/servicio-page.component'),
  },
  {
    path: 'empleados',
    loadComponent: () => import('../catalogos/pages/empleados-page/empleados-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
  },
  {
    path: 'empleados/:id',
    loadComponent: () => import('../catalogos/pages/empleado-page/empleado-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
  },
  {
    path: 'clientes',
    loadComponent: () => import('../catalogos/pages/clientes-page/clientes-page.component'),
    data: { menu: EnumMenuOption.CATALOGOS }
  },
  {
    path: 'clientes/:id',
    loadComponent: () => import('../catalogos/pages/cliente-page/cliente-page.component'),
    data: { menu: EnumMenuOption.CATALOGOS }
  },
  {
    path: 'empresas',
    loadComponent: () => import('../catalogos/pages/empresas-page/empresas-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
  },
  {
    path: 'empresas/:id',
    loadComponent: () => import('../catalogos/pages/empresa-page/empresa-page.component'),
    data: { role: [ EnumRole.ADMIN], menu: EnumMenuOption.CATALOGOS },
  },
  {
    path: 'vehiculos',
    loadComponent: () => import('../catalogos/pages/vehiculos-page/vehiculos-page.component'),
    data: { menu: EnumMenuOption.CATALOGOS }
  },
  {
    path: 'vehiculos/:id',
    loadComponent: () => import('../catalogos/pages/vehiculo-page/vehiculo-page.component'),
    data: { menu: EnumMenuOption.CATALOGOS }
  },
  {
    path: '**',
    redirectTo: 'marcas'
  }

]

export default catalogosRoutes;
