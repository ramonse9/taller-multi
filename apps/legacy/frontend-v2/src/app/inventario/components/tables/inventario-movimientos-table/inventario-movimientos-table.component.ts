import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros, EnumInventarioMotivoMovimiento, EnumInventarioTipoMovimiento } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { InventarioMovimiento } from '@inventario/interfaces/inventario-movimiento.interface';
import { BadgePositivoNegativoComponent } from "@shared/components/badges/badge-positivo-negativo/badge-positivo-negativo";
import { BadgeInventarioTipoMovimientoComponent } from "@shared/components/badges/badge-inventario-tipo-movimiento/badge-inventario-tipo-movimiento";

@Component({
  selector: 'app-inventario-movimientos-table',
  imports: [CommonModule, TextPreviewComponent, BadgeMessageComponent, BadgePositivoNegativoComponent, BadgeInventarioTipoMovimientoComponent],
  templateUrl: './inventario-movimientos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventarioMovimientosTableComponent {

  inventarioMovimientos = input.required<InventarioMovimiento[]>();

  inventarioMovimientosListado = linkedSignal( () => this.inventarioMovimientos() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumInventarioTipoMovimiento(){
    return EnumInventarioTipoMovimiento;
  }

  get EnumInventarioMotivoMovimiento(){
    return EnumInventarioMotivoMovimiento;
  }

 }
