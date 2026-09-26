import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { EstatusService } from '@shared/services/estatus.service';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { CardOrdenComponent } from '../card-orden/card-orden.component';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-cards-ordenes',
  imports: [ CardOrdenComponent, BadgeMessageComponent],
  templateUrl: './cards-ordenes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsOrdenesComponent {

  ordenes = input.required<Orden[]>();

  estatusService = inject(EstatusService)

  ordenesListado = linkedSignal( () => this.ordenes() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

    this.ordenesListado.update( ordenes => ordenes.map( o => o.id === ordenActualizada.id ? { ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] } : o )  )

  }

 }
