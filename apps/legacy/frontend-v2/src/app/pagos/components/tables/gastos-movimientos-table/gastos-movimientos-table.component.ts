import { ChangeDetectionStrategy, Component, inject, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { ModalOrdenesNotasAddComponent } from '@operaciones/components/modals/modal-ordenes-notas-add/modal-ordenes-notas-add.component';
import { EstatusService } from '@shared/services/estatus.service';
import { CardVehiculoComponent } from '@catalogos/components/cards/card-vehiculo/card-vehiculo.component';
import { ModalOrdenesEstatusUpdateComponent } from '@operaciones/components/modals/modal-ordenes-estatus-update/modal-ordenes-estatus-update.component';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { ListPagos } from "@facturas/components/list-pagos/list-pagos";
import { BadgeSimple } from "@shared/components/badges/badge-simple/badge-simple";
import { NgIcon } from '@ng-icons/core';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { GastoMovimiento } from '@pagos/interfaces/gasto-movimiento.interface';

@Component({
  selector: 'app-gastos-movimientos-table',
  imports: [CommonModule, NgIcon, RouterLink, CardClienteComponent, CardVehiculoComponent, TextPreviewComponent, ModalOrdenesEstatusUpdateComponent, ModalOrdenesNotasAddComponent, CardEmpresaComponent, ListPagos, BadgeSimple],
  templateUrl: './gastos-movimientos-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastosMovimientosTableComponent {

  gastosMovimientos = input.required<GastoMovimiento[]>();

  estatusService = inject(EstatusService)

  gastosMovimientosListado = linkedSignal( () => this.gastosMovimientos() )

  /*get EnumCategoria(){
    return EnumCategoria;
  }*/

  /*get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumEstatusOrdenFactura(){
    return EnumEstatusOrdenFactura;
  }*/

  //get EnumEstatusCFDI(){
  //  return EnumEstatusCFDI;
  //}

  //get EnumSatMetodoPago(){
  //  return EnumSatMetodoPago;
  //}

  /*ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

    this.ordenesListado.update( ordenes => ordenes.map( o => o.id === ordenActualizada.id ? { ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] } : o )  )

  }

  ordenNotasActualizada( notas: OrdenNota[] ){

    this.ordenesListado.update( ordenes => ordenes.map( o => o.id === notas[notas.length - 1].id_orden ? {...o, notas: notas} : o ))

  }*/

 }
