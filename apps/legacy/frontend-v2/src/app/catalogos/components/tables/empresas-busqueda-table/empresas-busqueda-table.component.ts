import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ClienteEmpresa } from '@facturas/interfaces/cliente-empresa.interface';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';

@Component({
  selector: 'app-empresas-busqueda-table',
  imports: [CommonModule],
  templateUrl: './empresas-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresasBusquedaTableComponent {

  //clientesEmpresas = input.required<Cliente[] | Empresa[]>()
  empresas = input.required<Empresa[]>()

  //@Output() clienteEmpresaSelected = new EventEmitter<Cliente | Empresa>();
  @Output() empresaSelected = new EventEmitter<Empresa>();

  //selectClienteEmpresa( clienteEmpresa: Cliente | Empresa ){
  selectEmpresa( empresa: Empresa ){

    this.empresaSelected.emit( empresa );

  }

 }
