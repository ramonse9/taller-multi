import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { Producto } from '@inventario/interfaces/producto.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";

@Component({
  selector: 'app-productos-stock-bajo-table',
  imports: [CommonModule, BadgeSimple, BadgeCodigoBarrasComponent, BadgePrecioVentaComponent],
  templateUrl: './productos-stock-bajo-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosStockBajoTableComponent implements OnInit {

  productos = input.required<Producto[]>();
  @Output() productoSelected = new EventEmitter<Producto>();

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

  selectProducto( producto: Producto ){

    this.productoSelected.emit( producto );

  }

}
