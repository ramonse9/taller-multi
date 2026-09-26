import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, output, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";

@Component({
  selector: 'app-servicios-table',
  imports: [CommonModule, BadgeMessageComponent, BadgePrecioVentaComponent],
  templateUrl: './servicios-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiciosTableComponent{

  servicios = input.required<Servicio[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

}
