import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-productos-servicios-busqueda-table',
  imports: [CommonModule, BadgeSimple],
  templateUrl: './productos-servicios-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosServiciosBusquedaTableComponent {

  productosServicios = input.required<ProductoServicio[]>();
  @Output() productoServicioSelected = new EventEmitter<ProductoServicio>();

  calcularBadgeSimpleColor( tipoProductoServicio: string ): EnumBadgeSimpleColor{
    switch ( tipoProductoServicio ) {
      case 'producto':
        return EnumBadgeSimpleColor.GREEN;
      case 'servicio':
        return EnumBadgeSimpleColor.YELLOW;
      default:
        return EnumBadgeSimpleColor.RED;
    }
  }

  selectProductoServicio( productoServicio: ProductoServicio ){

    this.productoServicioSelected.emit( productoServicio );

  }

}
