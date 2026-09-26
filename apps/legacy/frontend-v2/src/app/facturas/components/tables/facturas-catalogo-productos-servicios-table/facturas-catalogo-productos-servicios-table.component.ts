import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SatProductoServicio } from '@facturas/interfaces/sat-producto-servicio.interface';

@Component({
  selector: 'app-facturas-catalogo-productos-servicios-table',
  imports: [CommonModule],
  templateUrl: './facturas-catalogo-productos-servicios-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasCatalogoProductosServiciosTableComponent {

    satProductosServicios = input.required<SatProductoServicio[]>();

 }
