import { Routes } from '@angular/router';
import { EnumMenuOption } from '@shared/enums/general-estatus.enum';

export const facturasRoutes: Routes = [
  {
    path: '',
    redirectTo: 'facturas',
    pathMatch: 'full'
  },
  {
    path: 'facturas',
    loadComponent: () => import('./pages/facturas-page/facturas-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
  {
    path: 'misdatos',
    loadComponent: () => import('./pages/mis-datos-page/mis-datos-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
  {
    path: 'facturarorden/:id',
    loadComponent: () => import('./pages/facturar-orden-page/facturar-orden-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
  {
    path: 'complementopagoorden/:id',
    loadComponent: () => import('./pages/complemento-pago-orden-page/complemento-pago-orden-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
  {
    path: 'cancelarfactura/:id',
    loadComponent: () => import('./pages/cancelar-factura-page/cancelar-factura-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/factura-page/factura-page.component'),
    data: { menu: EnumMenuOption.FACTURAS }
  },
]

export default facturasRoutes;
