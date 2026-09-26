import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { EnumEntidad } from '@shared/enums/general-estatus.enum';
import { CardComponentIdComponent } from '@catalogos/components/cards/card-component-id/card-component-id.component';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';

@Component({
  selector: 'app-card-proveedor',
  imports: [CommonModule, NgIcon, CardComponentIdComponent ],
  templateUrl: './card-proveedor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardProveedorComponent {

  proveedor = input.required<Proveedor>();
  //clienteLinked = linkedSignal( () => this.cliente());

  modificar = input<boolean>(false);

  seleccionado = input<boolean>(false);

  get EnumEntidad(){
    return EnumEntidad
  }

  //get tieneDatosFiscales(){
  //  return this.clienteLinked().razonSocial || this.clienteLinked().rfc || this.clienteLinked().codigoPostal || this.clienteLinked().satRegimenFiscal
  //}

  //getRegimenFiscalLabel(cliente: any): string {
  //  return !proveedor.satRegimenFiscal ? '' : `${cliente.satRegimenFiscal?.clave} - ${cliente.satRegimenFiscal?.descripcion.toUpperCase()}`;
  //}

  //getUsoCFDILabel(cliente: Cliente): string {
  //  return !cliente.satUsoCFDI ? '' : `${cliente.satUsoCFDI?.clave} - ${cliente.satUsoCFDI?.descripcion.toUpperCase()}`;
  //}

  //actualizarCliente( clienteActualizado: Cliente){
  //  this.clienteLinked.set( clienteActualizado );
  //}

}
