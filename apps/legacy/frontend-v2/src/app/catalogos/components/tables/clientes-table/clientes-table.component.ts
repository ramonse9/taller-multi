import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-clientes-table',
  imports: [CommonModule, BadgeMessageComponent],
  templateUrl: './clientes-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesTableComponent {

  clientes = input.required<Cliente[]>()

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  getRegimenFiscalLabel(cliente: Cliente): string {

    return !cliente.satRegimenFiscal ? '' : `${cliente.satRegimenFiscal?.clave} - ${cliente.satRegimenFiscal?.descripcion.toUpperCase()}`;

  }

  getUsoCFDILabel(cliente: Cliente): string {

    return !cliente.satUsoCFDI ? '' : `${cliente.satUsoCFDI?.clave} - ${cliente.satUsoCFDI?.descripcion.toUpperCase()}`;

  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }
}
