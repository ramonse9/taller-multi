import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { CompraLite } from '@inventario/interfaces/compra.interface';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";

@Component({
  selector: 'app-compras-table',
  imports: [CommonModule, BadgeMessageComponent, EstatusBadgeComponent, BadgeCodigoBarrasComponent],
  templateUrl: './compras-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComprasTableComponent {

  compras = input.required<CompraLite[]>();

  idSeleccionado = input<string | null>(null);

  idSeleccionarEmit = output<string>()

  comprasListado = linkedSignal( () => this.compras() )

  get EnumCategoria(){
    return EnumCategoria;
  }

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
