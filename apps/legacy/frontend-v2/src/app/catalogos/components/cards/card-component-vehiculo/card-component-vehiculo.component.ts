import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponentIconFondoComponent } from '../card-component-icon-fondo/card-component-icon-fondo.component';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';

@Component({
  selector: 'app-card-component-vehiculo',
  imports: [ CommonModule, CardComponentIconFondoComponent, CardComponentIconFondoComponent],
  templateUrl: './card-component-vehiculo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponentVehiculoComponent {

    vehiculo = input.required<Vehiculo>();
    bgColor = input<string>("bg-white dark:bg-slate-900");



 }
