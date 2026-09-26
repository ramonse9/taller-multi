import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Marca } from '../../../interfaces/marca.interface';
import { CommonModule } from '@angular/common';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-marcas-table',
  imports: [CommonModule, BadgeMessageComponent],
  templateUrl: './marcas-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarcasTableComponent {

  marcas = input.required<Marca[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

}
