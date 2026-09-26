import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';

@Component({
  selector: 'app-vehiculos-busqueda-table',
  imports: [CommonModule],
  templateUrl: './vehiculos-busqueda-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosBusquedaTableComponent {

  vehiculos = input.required<Vehiculo[]>()
  @Output() vehiculoSelected = new EventEmitter<Vehiculo>();

  selectVehiculo( vehiculo: Vehiculo ){

    this.vehiculoSelected.emit( vehiculo );

  }

 }
