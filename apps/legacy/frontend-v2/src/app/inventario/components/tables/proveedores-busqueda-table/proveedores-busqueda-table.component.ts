import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';

@Component({
  selector: 'app-proveedores-busqueda-table',
  imports: [CommonModule ],
  templateUrl: './proveedores-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresBusquedaTableComponent {

  proveedores = input.required<Proveedor[]>();
  @Output() proveedorSelected = new EventEmitter<Proveedor>();

  selectProveedor( proveedor: Proveedor ){

    this.proveedorSelected.emit( proveedor );

  }

}
