import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumCategoria, EnumEntidad, EnumEstatusCompra, EnumLinks } from '@shared/enums/general-estatus.enum';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { Producto } from '@inventario/interfaces/producto.interface';
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";
import { CardComponentIdComponent } from "@catalogos/components/cards/card-component-id/card-component-id.component";

@Component({
  selector: 'app-card-producto',
  imports: [CommonModule, BadgeCodigoBarrasComponent, BadgePrecioVentaComponent, BadgeSiNoComponent, CardComponentIdComponent],
  templateUrl: './card-producto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardProductoComponent {

  producto = input.required<Producto>();

  productoLinked = linkedSignal( () => this.producto() )

  seleccionado = input<boolean>(false);

  get EnumEntidad(){
    return EnumEntidad;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusCompra(){
    return EnumEstatusCompra;
  }

}
