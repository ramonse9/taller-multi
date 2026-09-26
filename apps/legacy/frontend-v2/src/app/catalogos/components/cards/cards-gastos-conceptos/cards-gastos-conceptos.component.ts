import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

//import { GastoConcepto } from '@pagos/interfaces/gasto.interface';
//import { CardGastoConceptoComponent } from "../card-gasto/card-gasto.component";

@Component({
  selector: 'app-cards-gastos-conceptos',
  imports: [ ],
  templateUrl: './cards-gastos-conceptos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsGastosConceptosComponent {

  //gastosConceptos = input.required<GastoConcepto[]>();

  //gastosConceptosListado = linkedSignal( () => this.gastosConceptos() )

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

 }
