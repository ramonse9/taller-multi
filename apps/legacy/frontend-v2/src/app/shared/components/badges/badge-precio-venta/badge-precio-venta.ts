import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-precio-venta',
  imports: [CommonModule],
  templateUrl: './badge-precio-venta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePrecioVentaComponent{

  precioVenta = input.required<number>();

}
