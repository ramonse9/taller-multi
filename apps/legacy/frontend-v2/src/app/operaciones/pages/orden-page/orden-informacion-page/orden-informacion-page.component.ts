import { CardComponentDescriptionComponent } from '../../../../catalogos/components/cards/card-component-description/card-component-description.component';
import { ChangeDetectionStrategy, Component, EventEmitter, input, linkedSignal, OnInit, Output } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { ImagesLighboxComponent } from '@shared/components/images/imagesLighbox/imagesLighbox.component';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { EnumBadgeSimpleColor, EnumCategoria, EnumEstatusCFDI, EnumEstatusOrden, EnumEstatusOrdenFactura, EnumSatMetodoPago } from '@shared/enums/general-estatus.enum';
import { OrdenConcepto } from '@operaciones/interfaces/orden-concepto.interface';
import { NgIcon } from '@ng-icons/core';
import { EstatusIndicatorComponent } from '@shared/components/estatus-indicator/estatus-indicator.component';
import { ModalOrdenesNotasAddComponent } from "@operaciones/components/modals/modal-ordenes-notas-add/modal-ordenes-notas-add.component";
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { RouterLink } from '@angular/router';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';
import { FacturaConcepto } from '@facturas/interfaces/factura-concepto.interface';
import { DropdownOrdenesEstatusUpdateComponent } from '@operaciones/components/dropdowns/dropdown-ordenes-estatus-update/dropdown-ordenes-estatus-update.component';
import { CardComponentClienteEmpresaComponent } from '@catalogos/components/cards/card-component-cliente-empresa/card-component-cliente-empresa.component';
import { CardComponentVehiculoComponent } from '@catalogos/components/cards/card-component-vehiculo/card-component-vehiculo.component';
import { DropdownOrdenesPagadaUpdateComponent } from "@operaciones/components/dropdowns/dropdown-ordenes-pagada-update/dropdown-ordenes-pagada-update.component";

@Component({
  selector: 'app-orden-informacion-page',
  imports: [CommonModule, NgIcon, RouterLink, DatePipe, EstatusBadgeComponent, EstatusIndicatorComponent, ImagesLighboxComponent, ModalOrdenesNotasAddComponent, BadgeSimple, DropdownOrdenesEstatusUpdateComponent, CardComponentDescriptionComponent, CardComponentClienteEmpresaComponent, CardComponentVehiculoComponent, DropdownOrdenesPagadaUpdateComponent],
  templateUrl: './orden-informacion-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenInformacionPageComponent implements OnInit {

  orden = input.required<Orden>();

  ordenLinked = linkedSignal( () => this.orden() )

  imagenSeleccionada: string | null = null;

  @Output() refrescarInformacionEmit = new EventEmitter<void>();

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusOrden(){
    return EnumEstatusOrden;
  }

  get EnumEstatusOrdenFactura(){
    return EnumEstatusOrdenFactura;
  }

  get EnumSatMetodoPago(){
    return EnumSatMetodoPago;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumEstatusCFDI(){
    return EnumEstatusCFDI;
  }

  get subtotalOrden(){
    return this.orden().conceptos.reduce( (acumulador: number , concepto: OrdenConcepto) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get totalFactura(){

    const conceptos = this.primerFacturaVigenteConceptos;

    if( conceptos.length == 0 )  return 0;

    return conceptos.reduce( (acumulador: number , concepto: FacturaConcepto) => {
      return acumulador + ( Number( concepto.subtotal ) + this.sumaRestaImpuestos( concepto.impuestos ) )
    }, 0)
  }

  get nombreCompleto(){
    return !this.orden().cliente ? '' : this.orden().cliente!.nombre
  }

  get primerFacturaVigenteConceptos(): FacturaConcepto[]{
    return this.orden().facturas?.find( f => f.estatus === EnumEstatusCFDI.VIGENTE )?.conceptos || []
  }

  get fechasCronograma(){
    return this.orden().notas.filter( n => n.estatus != null).map( n => ({ id: n.id, estatus: n.estatus, fecha: n.createdAt}))
  }



  ngOnInit(): void {

  }

  sumaRestaImpuestos(impuestos: any){

    let cantidad = 0;
    impuestos.forEach( (i :any) => {
      if( i.tipo == 'Traslado'){
        cantidad += Number( i.importe )
      }else{
        cantidad -= Number( i.importe )
      }
    })

    return cantidad;

  }

  ordenNotasActualizada( notas: OrdenNota[] ){

    this.ordenLinked.update( o => ( { ...o, notas: notas } ) )

  }

  refrescarInformacion(){
    this.refrescarInformacionEmit.emit();
  }

  ordenPagoActualizada(ordenActualizada: Partial<Orden>){

    this.ordenLinked.update( o => ({ ...o, ...ordenActualizada }) )

  }

}
