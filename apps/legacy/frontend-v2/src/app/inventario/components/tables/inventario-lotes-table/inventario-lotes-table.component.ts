import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros  } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { InventarioLote } from '@inventario/interfaces/inventario-lote.interface';

@Component({
  selector: 'app-inventario-lotes-table',
  imports: [CommonModule, TextPreviewComponent, BadgeMessageComponent ],
  templateUrl: './inventario-lotes-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventarioLotesTableComponent {

  inventarioLotes = input.required<InventarioLote[]>();

  inventarioLotesListado = linkedSignal( () => this.inventarioLotes() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  /*get EnumInventarioTipoMovimiento(){
    return EnumInventarioTipoMovimiento;
  }

  get EnumInventarioMotivoMovimiento(){
    return EnumInventarioMotivoMovimiento;
  }*/

 }
