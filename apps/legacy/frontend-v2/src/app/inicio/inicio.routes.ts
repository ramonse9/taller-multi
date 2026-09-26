import { Routes } from '@angular/router';
import { EnumMenuOption } from '@shared/enums/general-estatus.enum';

export const inicioRoutes: Routes = [
  {
    path: '',
    redirectTo: 'accesos',
    pathMatch: 'full'
  },
  {
    path: 'accesos',
    loadComponent: () => import('./pages/accesos-rapidos-page/accesos-rapidos-page.component'),
    data: { menu: EnumMenuOption.INICIO }
  },
]

export default inicioRoutes;
