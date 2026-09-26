import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-vehiculos-table',
  imports: [CommonModule, BadgeMessageComponent],
  templateUrl: './vehiculos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculosTableComponent {

  vehiculos = input.required<Vehiculo[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }


 }
