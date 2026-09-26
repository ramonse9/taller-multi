import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { CardGastoComponent } from "@catalogos/components/cards/card-gasto/card-gasto.component";

@Component({
  selector: 'app-cards-gastos',
  imports: [BadgeMessageComponent, CardGastoComponent],
  templateUrl: './cards-gastos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsGastosComponent {

  gastos = input.required<Gasto[]>();

  gastosListado = linkedSignal( () => this.gastos() )

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

 }
