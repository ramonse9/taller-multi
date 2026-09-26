import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, output, Output } from '@angular/core';
import { Producto } from '@inventario/interfaces/producto.interface';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';
import { CardProductoComponent } from "@inventario/components/cards/card-producto/card-producto.component";

@Component({
  selector: 'app-productos-busqueda-table',
  imports: [CommonModule, CardProductoComponent],
  templateUrl: './productos-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosBusquedaTableComponent implements OnInit {

  productos = input.required<Producto[]>();
  //@Output() productoSelected = new EventEmitter<Producto>();
  productoSelected = output<Producto>()

  calcularBadgeSimpleColor( tipoProducto: string ): EnumBadgeSimpleColor{
    switch ( tipoProducto ) {
      case 'producto':
        return EnumBadgeSimpleColor.GREEN;
      case 'servicio':
        return EnumBadgeSimpleColor.YELLOW;
      default:
        return EnumBadgeSimpleColor.RED;
    }
  }

  ngOnInit() {

  }

  seleccionar( producto: Producto ){

    this.productoSelected.emit( producto );

  }

}
