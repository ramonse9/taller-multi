import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { Producto } from '@inventario/interfaces/producto.interface';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { BadgePrecioVentaComponent } from "@shared/components/badges/badge-precio-venta/badge-precio-venta";
import { BadgeSiNoComponent } from "@shared/components/badges/badge-si-no/badge-si-no";

@Component({
  selector: 'app-productos-table',
  imports: [CommonModule, NgIcon, RouterLink, TextPreviewComponent, BadgeMessageComponent, BadgeCodigoBarrasComponent, BadgePrecioVentaComponent, BadgeSiNoComponent],
  templateUrl: './productos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosTableComponent {

  productos = input.required<Producto[]>();

  productosListado = linkedSignal( () => this.productos() )

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  seleccionarEmit(id: string){
    this.idSeleccionarEmit.emit( id )
  }


 }
