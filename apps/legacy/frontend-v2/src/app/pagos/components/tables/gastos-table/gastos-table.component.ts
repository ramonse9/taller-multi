import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, output, Output } from '@angular/core';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-gastos-table',
  imports: [CommonModule],
  templateUrl: './gastos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastosTableComponent {

  gastos = input.required<Gasto[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

 }
