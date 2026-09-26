import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { EnumEntidad, EnumLinks } from '@shared/enums/general-estatus.enum';
import { CardComponentIdComponent } from '../card-component-id/card-component-id.component';

@Component({
  selector: 'app-card-vehiculo',
  imports: [CommonModule, CardComponentIdComponent ],
  templateUrl: './card-vehiculo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardVehiculoComponent {

  vehiculo = input.required<Vehiculo>()
  escalar = input<Boolean>(true);

  vehiculoLinked = linkedSignal( () => this.vehiculo());

  modificar = input<boolean>(false);

  seleccionado = input<boolean>(false);

  get EnumLinks(){
    return EnumLinks;
  }

  get EnumEntidad(){
    return EnumEntidad
  }

  actualizarVehiculo( vehiculoActualizado: Vehiculo){
    this.vehiculoLinked.set( vehiculoActualizado );
  }

 }
