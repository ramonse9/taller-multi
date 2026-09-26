import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, output, Output } from '@angular/core';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';

@Component({
  selector: 'app-proveedores-table',
  imports: [CommonModule, BadgeSimple],
  templateUrl: './proveedores-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresTableComponent {

  proveedores = input.required<Proveedor[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  seleccionarEmit( id: string ){

    this.idSeleccionarEmit.emit( id );

  }

 }
