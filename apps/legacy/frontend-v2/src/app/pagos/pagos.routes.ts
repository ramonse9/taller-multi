import { Routes } from '@angular/router';
import { EnumMenuOption } from '@shared/enums/general-estatus.enum';

export const pagosRoutes: Routes = [
  {
    path: '',
    redirectTo: 'gastospormes',
    pathMatch: 'full'
  },
  {
    path: 'gastospormes',
    loadComponent: () => import('./pages/gastos-movimientos-page/gastos-movimientos-page.component'),
    data: { menu: EnumMenuOption.PAGOS }
  },
  {
    path: 'gastos/:id',
    loadComponent: () => import('./pages/gasto-movimiento-page/gasto-movimiento-page.component'),
    data: { menu: EnumMenuOption.PAGOS }
  },
  {
    path: 'nomina',
    loadComponent: () => import('./pages/empleados-movimientos-page/empleados-movimientos-page.component'),
    data: { menu: EnumMenuOption.PAGOS }
  },

]

export default pagosRoutes;
