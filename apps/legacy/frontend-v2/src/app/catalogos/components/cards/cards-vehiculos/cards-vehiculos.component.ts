import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { EstatusService } from '@shared/services/estatus.service';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { CardVehiculoComponent } from '../card-vehiculo/card-vehiculo.component';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';

@Component({
  selector: 'app-cards-vehiculos',
  imports: [ CardVehiculoComponent, BadgeMessageComponent],
  templateUrl: './cards-vehiculos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsVehiculosComponent {

  vehiculos = input.required<Vehiculo[]>();

  estatusService = inject(EstatusService)

  vehiculosListado = linkedSignal( () => this.vehiculos() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  //ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

  //  this.ordenesListado.update( ordenes => ordenes.map( o => o.id === ordenActualizada.id ? { ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] } : o )  )

  //}

 }
