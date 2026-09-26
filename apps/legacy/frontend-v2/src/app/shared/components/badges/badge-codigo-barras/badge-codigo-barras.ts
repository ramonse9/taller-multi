import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-codigo-barras',
  imports: [CommonModule],
  templateUrl: './badge-codigo-barras.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeCodigoBarrasComponent{

  codigoBarras = input.required<string>();

}
