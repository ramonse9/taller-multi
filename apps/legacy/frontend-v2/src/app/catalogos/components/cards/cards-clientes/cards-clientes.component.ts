import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output } from '@angular/core';
import { EstatusService } from '@shared/services/estatus.service';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { CardClienteComponent } from '../card-cliente/card-cliente.component';

@Component({
  selector: 'app-cards-clientes',
  imports: [ CardClienteComponent, BadgeMessageComponent],
  templateUrl: './cards-clientes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsClientesComponent {

  clientes = input.required<Cliente[]>();

  estatusService = inject(EstatusService)

  clientesListado = linkedSignal( () => this.clientes() )

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

 }
