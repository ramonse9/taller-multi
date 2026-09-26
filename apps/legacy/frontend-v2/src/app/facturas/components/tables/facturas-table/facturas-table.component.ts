import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Factura } from '@facturas/interfaces/factura.interface';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { ListPagos } from "@facturas/components/list-pagos/list-pagos";
import { BadgeSimple } from "@shared/components/badges/badge-simple/badge-simple";
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros, EnumEstatusCFDI, EnumSatMetodoPago, EnumSatTipoComprobante } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';


@Component({
  selector: 'app-facturas-table',
  imports: [CommonModule, RouterLink, EstatusBadgeComponent, ListPagos, BadgeSimple, BadgeMessageComponent ],
  templateUrl: './facturas-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasTableComponent {

  facturas = input.required<Factura[]>();

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumEstatusCFDI(){
    return EnumEstatusCFDI;
  }

  get EnumSatMetodoPago(){
    return EnumSatMetodoPago;
  }

  get EnumSatTipoComprobante(){
    return EnumSatTipoComprobante;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

}
