import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empresa } from '@catalogos/interfaces/empresa.interface';

@Component({
  selector: 'app-card-empresa-info',
  imports: [CommonModule],
  templateUrl: './card-empresa-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEmpresaInfoComponent {

  empresa = input.required<Empresa>()
  escalar = input<Boolean>(true);

}
