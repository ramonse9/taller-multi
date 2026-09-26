import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { CardCompraComponent } from '../card-compra/card-compra.component';
import { CompraLite } from '@inventario/interfaces/compra.interface';

@Component({
  selector: 'app-cards-compras',
  imports: [ CardCompraComponent, BadgeMessageComponent],
  templateUrl: './cards-compras.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsComprasComponent {

  compras = input.required<CompraLite[]>();

  comprasListado = linkedSignal( () => this.compras() )

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }

 }
