import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Modelo } from '../../../interfaces/modelo.interface';
import { CommonModule } from '@angular/common';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-modelos-table',
  imports: [CommonModule, BadgeMessageComponent],
  templateUrl: './modelos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelosTableComponent {

  modelos = input.required<Modelo[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

}
