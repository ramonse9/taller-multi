import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { GastoCategoria } from '@pagos/interfaces/gasto-categoria.interface';

@Component({
  selector: 'app-gastos-categorias-table',
  imports: [CommonModule],
  templateUrl: './gastos-categorias-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastosCategoriasTableComponent {

  gastosCategorias = input.required<GastoCategoria[]>();

  @Output() gastoCategoriaSelected = new EventEmitter<GastoCategoria>();

  selectGastoCategoria( gastoCategoria: GastoCategoria ){

    this.gastoCategoriaSelected.emit( gastoCategoria );

  }

}
