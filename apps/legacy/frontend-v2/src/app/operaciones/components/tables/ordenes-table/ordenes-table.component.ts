import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { ModalOrdenesNotasAddComponent } from '@operaciones/components/modals/modal-ordenes-notas-add/modal-ordenes-notas-add.component';
import { EstatusService } from '@shared/services/estatus.service';
import { CardVehiculoComponent } from '@catalogos/components/cards/card-vehiculo/card-vehiculo.component';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { ListPagos } from "@facturas/components/list-pagos/list-pagos";
import { BadgeSimple } from "@shared/components/badges/badge-simple/badge-simple";
import { EnumBadgeSimpleColor, EnumCategoria, EnumEstatusCFDI, EnumEstatusOrdenFactura, EnumSatMetodoPago } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';
import { DropdownOrdenesEstatusUpdateComponent } from '@operaciones/components/dropdowns/dropdown-ordenes-estatus-update/dropdown-ordenes-estatus-update.component';

@Component({
  selector: 'app-ordenes-table',
  imports: [CommonModule, NgIcon, RouterLink, CardClienteComponent, CardVehiculoComponent, TextPreviewComponent, ModalOrdenesNotasAddComponent, CardEmpresaComponent, ListPagos, BadgeSimple, DropdownOrdenesEstatusUpdateComponent],
  templateUrl: './ordenes-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenesTableComponent {

  ordenes = input.required<Orden[]>();

  estatusService = inject(EstatusService)

  ordenesListado = linkedSignal( () => this.ordenes() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumEstatusOrdenFactura(){
    return EnumEstatusOrdenFactura;
  }

  get EnumEstatusCFDI(){
    return EnumEstatusCFDI;
  }

  get EnumSatMetodoPago(){
    return EnumSatMetodoPago;
  }

  ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

    this.ordenesListado.update( ordenes => ordenes.map( o => o.id === ordenActualizada.id ? { ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] } : o )  )

  }

  ordenNotasActualizada( notas: OrdenNota[] ){

    this.ordenesListado.update( ordenes => ordenes.map( o => o.id === notas[notas.length - 1].id_orden ? {...o, notas: notas} : o ))

  }

 }
