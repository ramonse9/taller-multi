import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { EstatusService } from '@shared/services/estatus.service';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { CardEmpresaComponent } from '../card-empresa/card-empresa.component';

@Component({
  selector: 'app-cards-empresas',
  imports: [ CardEmpresaComponent, BadgeMessageComponent],
  templateUrl: './cards-empresas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsEmpresasComponent {

  empresas = input.required<Empresa[]>();

  estatusService = inject(EstatusService)

  empresasListado = linkedSignal( () => this.empresas() )

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
