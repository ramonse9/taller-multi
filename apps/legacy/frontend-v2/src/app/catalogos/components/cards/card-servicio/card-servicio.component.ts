import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumCategoria, EnumEntidad, EnumEstatusCompra, EnumLinks } from '@shared/enums/general-estatus.enum';
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { CardComponentIdComponent } from "../card-component-id/card-component-id.component";

@Component({
  selector: 'app-card-servicio',
  imports: [CommonModule, BadgePrecioVentaComponent, BadgeSiNoComponent, CardComponentIdComponent],
  templateUrl: './card-servicio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardServicioComponent {

  servicio = input.required<Servicio>();

  servicioLinked = linkedSignal( () => this.servicio() )

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
