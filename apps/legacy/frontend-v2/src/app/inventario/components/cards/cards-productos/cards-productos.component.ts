import { ChangeDetectionStrategy, Component, EventEmitter, input, linkedSignal, output, Output } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { Producto } from '@inventario/interfaces/producto.interface';
import { CardProductoComponent } from "../card-producto/card-producto.component";

@Component({
  selector: 'app-cards-productos',
  imports: [BadgeMessageComponent, CardProductoComponent],
  templateUrl: './cards-productos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsProductosComponent {

  productos = input.required<Producto[]>();

  productosListado = linkedSignal( () => this.productos() )

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>();

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  seleccionarEmit( id: string){
    this.idSeleccionarEmit.emit( id );
  }

 }
