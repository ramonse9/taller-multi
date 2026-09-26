import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CountUpModule } from 'ngx-countup';
import { RouterLink } from '@angular/router';
import { DashboardCountAll } from '@dashboard/interfaces/dashboard-interface';

type DashboardKeys = keyof DashboardCountAll

@Component({
  selector: 'app-dashboard-count',
  imports: [CountUpModule, RouterLink],
  templateUrl: './dashboard-count.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCountComponent {

  countAll = input.required<DashboardCountAll | undefined>()

  items: {label: string, key: DashboardKeys, route: string}[] = [
    { label: 'Órdenes', key: 'ordenes', route: '/operaciones/ordenes'},
    { label: 'Vehículos', key: 'vehiculos', route: '/catalogos/vehiculos'},
    { label: 'Clientes', key: 'clientes', route: '/catalogos/clientes'},
    { label: 'Empresas', key: 'empresas', route: '/catalogos/empresas'},
    { label: 'Marcas', key: 'marcas', route: '/catalogos/marcas'},
    { label: 'Modelos', key: 'modelos', route: '/catalogos/modelos'}
  ]

  getCount( key: DashboardKeys ): number{
    return this.countAll()?.[key] ?? 0;
  }

}
