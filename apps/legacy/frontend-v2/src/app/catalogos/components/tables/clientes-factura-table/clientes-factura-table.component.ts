import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@catalogos/interfaces/cliente.interface';

@Component({
  selector: 'app-clientes-factura-table',
  imports: [CommonModule],
  templateUrl: './clientes-factura-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesFacturaTableComponent {

  clientes = input.required<Cliente[]>()
  @Output() clienteSelected = new EventEmitter<Cliente>();

  selectCliente( cliente: Cliente ){

    this.clienteSelected.emit( cliente );

  }

}
