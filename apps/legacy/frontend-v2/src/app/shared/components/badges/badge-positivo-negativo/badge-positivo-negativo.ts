import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-positivo-negativo',
  imports: [CommonModule],
  templateUrl: './badge-positivo-negativo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePositivoNegativoComponent{

  cantidad = input.required<number>();

  get valorAbsoluto(){
    return Math.abs( this.cantidad() )
  }


}
