import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-card-cliente-info',
  imports: [CommonModule, NgIcon],
  templateUrl: './card-cliente-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardClienteInfoComponent {

  cliente = input.required<Cliente>();
  escalar = input<Boolean>(true);

}
