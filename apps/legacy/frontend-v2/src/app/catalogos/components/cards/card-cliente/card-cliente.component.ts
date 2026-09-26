import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { NgIcon } from '@ng-icons/core';
import { EnumEntidad } from '@shared/enums/general-estatus.enum';
import { CardComponentIdComponent } from '../card-component-id/card-component-id.component';

@Component({
  selector: 'app-card-cliente',
  imports: [CommonModule, NgIcon, CardComponentIdComponent ],
  templateUrl: './card-cliente.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardClienteComponent {

  cliente = input.required<Cliente>();
  clienteLinked = linkedSignal( () => this.cliente());

  modificar = input<boolean>(false);

  seleccionado = input<boolean>(false);

  get EnumEntidad(){
    return EnumEntidad
  }

  get tieneDatosFiscales(){
    return this.clienteLinked().razonSocial || this.clienteLinked().rfc || this.clienteLinked().codigoPostal || this.clienteLinked().satRegimenFiscal
  }

  getRegimenFiscalLabel(cliente: any): string {

    return !cliente.satRegimenFiscal ? '' : `${cliente.satRegimenFiscal?.clave} - ${cliente.satRegimenFiscal?.descripcion.toUpperCase()}`;
  }

  getUsoCFDILabel(cliente: Cliente): string {

    return !cliente.satUsoCFDI ? '' : `${cliente.satUsoCFDI?.clave} - ${cliente.satUsoCFDI?.descripcion.toUpperCase()}`;
  }

  actualizarCliente( clienteActualizado: Cliente){
    this.clienteLinked.set( clienteActualizado );
  }

}
