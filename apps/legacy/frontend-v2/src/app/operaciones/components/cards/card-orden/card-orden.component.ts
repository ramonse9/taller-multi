import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, linkedSignal, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { NgIcon } from '@ng-icons/core';
import { EstatusIndicatorComponent } from "@shared/components/estatus-indicator/estatus-indicator.component";
import { EnumCategoria, EnumEntidad, EnumEstatusOrden, EnumEstatusOrdenFactura, EnumLinks, EnumOrdenConceptoTipo } from '@shared/enums/general-estatus.enum';
import { OrdenConcepto } from '@operaciones/interfaces/orden-concepto.interface';
import { ModalOrdenesNotasAddComponent } from "@operaciones/components/modals/modal-ordenes-notas-add/modal-ordenes-notas-add.component";
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { DropdownOrdenesEstatusUpdateComponent } from '@operaciones/components/dropdowns/dropdown-ordenes-estatus-update/dropdown-ordenes-estatus-update.component';
import { DropdownOrdenesPagadaUpdateComponent } from '@operaciones/components/dropdowns/dropdown-ordenes-pagada-update/dropdown-ordenes-pagada-update.component';
import { CardComponentIdComponent } from '../../../../catalogos/components/cards/card-component-id/card-component-id.component';
import { CardComponentDescriptionComponent } from '../../../../catalogos/components/cards/card-component-description/card-component-description.component';
import { PageButtonDetallesComponent } from '@shared/components/forms/page-button-detalles/page-button-detalles.component';
import { BadgeProductoServicioComponent } from '@shared/components/badges/badge-producto-servicio/badge-producto-servicio';
import { BadgeCodigoBarrasComponent } from '@shared/components/badges/badge-codigo-barras/badge-codigo-barras';

@Component({
  selector: 'app-card-orden',
  imports: [CommonModule, NgIcon, EstatusIndicatorComponent, ModalOrdenesNotasAddComponent, DropdownOrdenesEstatusUpdateComponent, DropdownOrdenesPagadaUpdateComponent, CardComponentIdComponent, PageButtonDetallesComponent, CardComponentDescriptionComponent, BadgeProductoServicioComponent, BadgeCodigoBarrasComponent],
  templateUrl: './card-orden.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardOrdenComponent {

  orden = input.required<Orden>()

  seleccionado = input<boolean>(false);

  ordenLinked = linkedSignal( () => this.orden() )

  facturaLabel = 'Sin facturar'

  //@Output() ordenEstatusActualizadaEmit = new EventEmitter<Partial<Orden>>()

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusOrdenFactura(){
    return EnumEstatusOrdenFactura;
  }

  get EnumLinks(){
    return EnumLinks;
  }

  get EnumEntidad(){
    return EnumEntidad
  }

  get EnumOrdenConceptoTipo(){
    return EnumOrdenConceptoTipo
  }

  get nombreCompleto(){
    return !this.orden().cliente ? '' : this.orden().cliente!.nombre
  }

  get subtotalOrden(){

    if( this.orden().conceptos.length == 0 ) return 0;

    return this.orden().conceptos.reduce( (acumulador: number , concepto: OrdenConcepto) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get totalFactura(){
    if( this.orden().facturas.length == 0) return 0;

    return this.orden().facturas[0].total;

  }

  get borderColor(){
    switch( this.orden().estatus ){
      case EnumEstatusOrden.FINALIZADO:
        return 'borden border-4 border-blue-600 dark:border-blue-800 rounded-tl-lg rounded-tr-lg';
      case EnumEstatusOrden.PROCESO:
        return 'border border-4 border-green-600 dark:border-green-800 rounded-lg rounded-tl-lg rounded-tr-lg';
      case EnumEstatusOrden.CANCELADO:
        return 'border border-4 border-purple-600 dark:border-purple-800 rounded-tl-lg rounded-tr-lg';
      default:
        return 'border border-4 border-red-600 dark:bg-red-800 rounded-tl-lg rounded-tr-lg';
    }
  }

  get bgColor(){
    switch( this.orden().estatus ){
      case EnumEstatusOrden.FINALIZADO:
        return 'bg-blue-900/40 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-tl-lg rounded-tr-lg';
      case EnumEstatusOrden.PROCESO:
        //return 'bg-green-600/40 text-green-600 dark:bg-green-900/40 dark:text-green-400 rounded-tl-lg rounded-tr-lg';
        return 'border border-4  border-green-500 dark:border-green-700 rounded-lg rounded-tl-lg rounded-tr-lg';
      case EnumEstatusOrden.CANCELADO:
        return 'bg-purple-900/40 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-tl-lg rounded-tr-lg';
      default:
        return 'bg-red-900/40 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-tl-lg rounded-tr-lg';
    }
  }

  footerClass = computed(() => {
    const estatus = this.orden().estatusFactura;
    const liquidada = this.orden().liquidacionFactura;
    const isTimbrada = estatus === EnumEstatusOrdenFactura.TIMBRADA;

    // Estado: Timbrada y Pagada
    if (isTimbrada && liquidada) {
      this.facturaLabel = 'Facturada y liquidada'
      return 'bg-green-300/50 dark:bg-green-700/50';
    }

    // Estado: Timbrada pero Pendiente de pago
    if (isTimbrada && !liquidada) {
      this.facturaLabel = 'Facturada sin liquidar'
      return 'bg-yellow-300/50 dark:bg-yellow-700/50';
    }

    // Estado: Sin Facturar o Borrador
    return 'bg-slate-300/50 dark:bg-slate-700/50';
  });

  // También podemos computar el color del texto del importe para que combine
  amountClass = computed(() => {
    const isTimbrada = this.orden().estatusFactura === EnumEstatusOrdenFactura.TIMBRADA;
    const liquidada = this.orden().liquidacionFactura;

    if (!isTimbrada) return 'text-slate-700 dark:text-white';
    return liquidada ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400';
  });

  /*
  ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

    this.ordenEstatusActualizadaEmit.emit( ordenActualizada )

  }*/


  ordenEstatusActualizada( ordenActualizada: Partial<Orden> ){

    //this.ordenesListado.update( ordenes => ordenes.map( o => o.id === ordenActualizada.id ? { ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] } : o )  )
    this.ordenLinked.update( o => ({ ...o, estatus: ordenActualizada.estatus!, notas: [...o.notas, ...ordenActualizada.notas!] })  )

  }

  ordenPagoActualizada(ordenActualizada: Partial<Orden>){

    this.ordenLinked.update( o => ({ ...o, ...ordenActualizada }) )

  }


  ordenNotasActualizada( notas: OrdenNota[] ){

    this.ordenLinked.update( o => ( { ...o, notas: notas } ) )

  }

}
