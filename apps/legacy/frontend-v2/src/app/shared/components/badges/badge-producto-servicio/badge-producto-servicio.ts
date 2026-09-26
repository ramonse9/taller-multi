import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TipoProductoServicio } from '@operaciones/pages/ordenes-page-new/ordenes-page-new.component';

@Component({
  selector: 'app-badge-producto-servicio',
  imports: [CommonModule],
  templateUrl: './badge-producto-servicio.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeProductoServicioComponent{

  tipoProductoServicio = input.required<TipoProductoServicio>();

}
