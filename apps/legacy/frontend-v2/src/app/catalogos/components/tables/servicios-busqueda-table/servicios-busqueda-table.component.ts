import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, output, Output } from '@angular/core';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';
import { CardServicioComponent } from "@catalogos/components/cards/card-servicio/card-servicio.component";

@Component({
  selector: 'app-servicios-busqueda-table',
  imports: [CommonModule, BadgeSimple, CardServicioComponent],
  templateUrl: './servicios-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiciosBusquedaTableComponent {

  servicios = input.required<Servicio[]>();
  //@Output() servicioSelected = new EventEmitter<Servicio>();
  servicioSelected = output<Servicio>()

  calcularBadgeSimpleColor( tipoServicio: string ): EnumBadgeSimpleColor{
    switch ( tipoServicio ) {
      case 'producto':
        return EnumBadgeSimpleColor.GREEN;
      case 'servicio':
        return EnumBadgeSimpleColor.YELLOW;
      default:
        return EnumBadgeSimpleColor.RED;
    }
  }

  //selectServicio( servicio: Servicio ){
  //  this.servicioSelected.emit( servicio );
  //}

  seleccionar( servicio: Servicio ){

    this.servicioSelected.emit( servicio );

  }

}
