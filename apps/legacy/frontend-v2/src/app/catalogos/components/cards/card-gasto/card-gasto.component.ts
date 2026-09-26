import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { EnumEntidad } from '@shared/enums/general-estatus.enum';
import { CardComponentIdComponent } from "../card-component-id/card-component-id.component";
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";

@Component({
  selector: 'app-card-gasto',
  imports: [CommonModule, TextPreviewComponent, CardComponentIdComponent, BadgeSiNoComponent],
  templateUrl: './card-gasto.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGastoComponent {

  gasto = input.required<Gasto>()

  seleccionado = input<boolean>(false);

  gastoLinked = linkedSignal( () => this.gasto() )

  get EnumEntidad(){
    return EnumEntidad;
  }
}
