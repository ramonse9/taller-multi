import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumCategoria, EnumEntidad, EnumEstatusCompra, EnumLinks } from '@shared/enums/general-estatus.enum';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { CompraDetalleLite, CompraLite } from '@inventario/interfaces/compra.interface';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { CardComponentIdComponent } from "@catalogos/components/cards/card-component-id/card-component-id.component";

@Component({
  selector: 'app-card-compra',
  imports: [CommonModule, EstatusBadgeComponent, BadgeCodigoBarrasComponent, CardComponentIdComponent],
  templateUrl: './card-compra.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardCompraComponent {

  compra = input.required<CompraLite>()

  compraLinked = linkedSignal( () => this.compra() )

  seleccionado = input<boolean>(false);

  get EnumEntidad(){
    return EnumEntidad;
  }

  get totalCompra(){
    return this.compra().detalles.reduce( (acumulador: number , concepto: CompraDetalleLite) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get EnumLinks(){
    return EnumLinks;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusCompra(){
    return EnumEstatusCompra;
  }

}
