import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cargando-detalles',
  imports: [CommonModule ],
  templateUrl: './cargando-detalles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargandoDetallesComponent {

}
