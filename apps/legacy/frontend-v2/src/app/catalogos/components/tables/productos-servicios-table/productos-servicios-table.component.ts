import { ChangeDetectionStrategy, Component, EventEmitter, input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';

@Component({
  selector: 'app-productos-servicios-table',
  imports: [CommonModule, RouterLink, BadgeMessageComponent, BadgeSimple],
  templateUrl: './productos-servicios-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosServiciosTableComponent{

  productosServicios = input.required<ProductoServicio[]>();
  @Output() productoServicioSelected = new EventEmitter<ProductoServicio>();


  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  selectProductoServicio( productoServicio: ProductoServicio ){

    this.productoServicioSelected.emit( productoServicio );

  }

  calcularBadgeSimpleColor( tipoProductoServicio: string ): EnumBadgeSimpleColor{
    if( tipoProductoServicio === 'servicio' ){
      return EnumBadgeSimpleColor.YELLOW;
    }

    return EnumBadgeSimpleColor.GREEN;

  }

 }
