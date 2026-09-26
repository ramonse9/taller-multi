import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { Cliente } from '@catalogos/interfaces/cliente.interface';

@Component({
  selector: 'app-clientes-busqueda-table',
  imports: [CommonModule],
  templateUrl: './clientes-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesBusquedaTableComponent {

  clientes = input.required<Cliente[]>()
  @Output() clienteSelected = new EventEmitter<Cliente>();

  selectCliente( cliente: Cliente ){

    this.clienteSelected.emit( cliente );

  }

 }
