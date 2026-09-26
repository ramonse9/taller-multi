import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';

@Component({
  selector: 'app-card-vehiculo-info',
  imports: [CommonModule, TextPreviewComponent],
  templateUrl: './card-vehiculo-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardVehiculoInfoComponent {

  vehiculo = input.required<Vehiculo>()
  escalar = input<Boolean>(true);

 }
