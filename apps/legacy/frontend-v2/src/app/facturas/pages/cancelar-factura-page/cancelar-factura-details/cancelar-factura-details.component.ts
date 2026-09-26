import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SatService } from '@catalogos/services/sat.service';
import { Factura } from '@facturas/interfaces/factura.interface';
import { PageFormControlListComponent } from "@shared/components/forms/page-form-control-list/page-form-control-list.component";
import { PageFormBodyComponent } from "@shared/components/forms/page-form-body/page-form-body.component";
import { PageFormHeaderComponent } from "@shared/components/forms/page-form-header/page-form-header.component";
import { CommonModule } from '@angular/common';
import { PageFormControlSearchTableGenericaNewComponent } from "@shared/components/forms/page-form-control-search-table-generica-new/page-form-control-search-table-generica-new.component";
import { ConceptoTable } from '@operaciones/pages/orden-page/orden-details/orden-details.component';
import { ConceptoDto, CreateCancelacionDto, FacturasService } from '@facturas/services/facturas.service';
import { ToastService } from '@shared/services/toast.service';
import { delay, firstValueFrom } from 'rxjs';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { FormUtils } from '@shared/utils/form-utils';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { FormErrorLabelComponent } from "@shared/components/forms/form-error-label/form-error-label.component";
import { PageFormControlSearchTableGenericaSimpleComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple/page-form-control-search-table-generica-simple.component";
import { ConceptosReadOnlyTableComponent } from "@facturas/components/tables/conceptos-read-only-table/conceptos-read-only-table.component";
import { FacturaConcepto } from '@facturas/interfaces/factura-concepto.interface';
import { ImpuestosReadOnlyTableComponent } from "@facturas/components/tables/impuestos-read-only-table/impuestos-read-only-table.component";
import { PlanoConcepto } from '@facturas/interfaces/plano-concepto.interface';
import { EnumEstatusToast, EnumPaginasTitulo, EnumSatCancelacionMotivo, EnumSatMetodoPago, EnumSatTipoPersona, EnumSeccion } from '@shared/enums/general-estatus.enum';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { ProductosServiciosBusquedaTableComponent } from '@catalogos/components/tables/productos-servicios-busqueda-table/productos-servicios-busqueda-table.component';
import { ConceptosTableComponent } from '@catalogos/components/tables/conceptos-table/conceptos-table.component';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';

interface Previsualizacion {
    metodoPagoDescripcion: string,
    formaPagoDescripcion: string,
    fechaEmision: string,
    condicionesPago: string,
    lugarExpedicion: string,
    observaciones: string
}

interface ConceptoForm{
  id: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: string;

}

interface CancelarFacturaForm{
  claveSatCancelacionMotivo: EnumSatCancelacionMotivo;
  conceptos: ConceptoForm[];

}

@Component({
  selector: 'app-cancelar-factura-details',
  imports: [PageFormControlListComponent, PageFormBodyComponent, PageFormHeaderComponent, CommonModule, ReactiveFormsModule, ProductosServiciosBusquedaTableComponent, ConceptosTableComponent, FormErrorLabelComponent, PageFormControlSearchTableGenericaSimpleComponent, ConceptosReadOnlyTableComponent, ImpuestosReadOnlyTableComponent],
  templateUrl: './cancelar-factura-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelarFacturaDetailsComponent implements AfterViewInit {

  factura = input.required<Factura>();
  //facturaOriginal = input.required<Factura>( deepClone(factura()));

  @ViewChild('pageFormControlSearchTableGenericaNew', {static: false}) pageFormControlSearchTableGenericaNew!: PageFormControlSearchTableGenericaNewComponent;

  fb = inject(FormBuilder);
  router = inject(Router);

  @ViewChild('dateInputEmision', { static: false }) dateInputEmision!: ElementRef;

  flatpickrEmisionInstance!: flatpickr.Instance;

  satService = inject(SatService);
  productosServiciosService = inject(ProductosServiciosService);
  ordenesService = inject(OrdenesService);
  toastService = inject(ToastService);
  facturasService = inject(FacturasService);
  authService = inject(AuthService);

  //orden = signal<Orden | null>(null);
  conceptosPlanoSignal = signal<PlanoConcepto[]>([]);

  textoFiltrarProductoServicio = signal('')
  private debounceTimer: any

  loadingConceptos = true
  seccion: EnumSeccion = EnumSeccion.NINGUNA;
  previsualizacion: Previsualizacion = {
    metodoPagoDescripcion: '',
    formaPagoDescripcion: '',
    fechaEmision: '',
    condicionesPago: '',
    lugarExpedicion: '',
    observaciones: ''
  }

  cancelarForm = this.fb.group({
    claveSatCancelacionMotivo: ['', Validators.required],
    conceptos: this.fb.array<FormGroup>([]),
    fechaEmision: [''],
    claveSatFormaPago: [''],
    condicionesPago: [''],
    claveSatMetodoPago: [''],
    lugarExpedicion: [''],
    observaciones: ['Factura desde una Orden', [Validators.maxLength(200)]],
  })

  normalizeDateStrings<T>(obj: T): T {
    const clone:any = structuredClone(obj);
    for (const key in clone) {
      const value = clone[key];
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        clone[key] = new Date(value).toISOString();
      } else if (typeof value === 'object' && value !== null) {
        clone[key] = this.normalizeDateStrings(value);
      }
    }
    return clone;
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  get EnumSatCancelacionMotivo(){
    return EnumSatCancelacionMotivo;
  }

  readonly receptorSatTipoPersona = computed( () =>
    this.factura().receptorSatTipoPersona.tipo === EnumSatTipoPersona.MORAL ? EnumSatTipoPersona.MORAL : EnumSatTipoPersona.FISICA
  )

  get conceptosFormArray(): FormArray<FormGroup>{
    return this.cancelarForm.get('conceptos') as FormArray
  }

  get EnumSeccion(){
    return EnumSeccion;
  }

  private getFechaEmisionInicial(){

    if( !this.factura().fechaEmision ){
      return new Date()
    }

    return new Date( this.factura().fechaEmision )
  }


  async ngAfterViewInit() {

    this.flatpickrEmisionInstance = flatpickr(this.dateInputEmision.nativeElement, {
      dateFormat: 'd-m-Y H:i',
      locale: Spanish,
      enableTime: true,
      defaultDate: new Date(),
      minDate: new Date().setDate( new Date().getDate() - 3 ),
      //minDate: new Date().fp_incr(14) // 14 days from now
      //maxDate: 'today',
      onChange: (selectedDates) => {
        const fecha = selectedDates[0];
        this.cancelarForm.controls.fechaEmision.setValue(fecha.toString());
      }

    });

    this.setFormValueReset()

    this.setFormValueFactura();

  }

  async optionSelectedCancelacionMotivo(optionClave: string){

    this.cancelarForm!.patchValue({
      claveSatCancelacionMotivo: optionClave
    })

    if( optionClave === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){
      this.seccion = EnumSeccion.CONCEPTOS
    }else{
      this.seccion = EnumSeccion.NINGUNA
    }

  }

  setFormValueRestaurar(){
    const conceptos = this.cancelarForm.get('conceptos') as FormArray;
    //this.cancelarForm!.reset({
    //  conceptos: []
    //})
    conceptos.clear();

    this.setFormValueFactura()

    this.seccion = EnumSeccion.CONCEPTOS;

  }

  setFormValueReset(){
                              //const conceptos = this.ordenForm.get('conceptos') as FormArray;
    const conceptos = this.cancelarForm.get('conceptos') as FormArray;
    this.cancelarForm!.reset({
      conceptos: []
    })
    conceptos.clear();
                                //this.ordenForm.reset()
  }

  setFormValueFactura(){

    this.factura().conceptos.forEach( concepto => {
      const conceptoTable = this.mapConceptoBDToOptionTable(concepto)
      this.agregarConceptoToArray( conceptoTable );
    })

    this.cancelarForm.patchValue({
      conceptos: this.factura().conceptos,
      //fechaEmision: FormUtils.formatIsoStringToLocalDisplay( this.factura().fechaEmision?.toString() ),
      claveSatMetodoPago: this.factura().satMetodoPago.clave,
      condicionesPago: this.factura().condicionesPago,
      claveSatFormaPago: this.factura().satFormaPago.clave,
      lugarExpedicion: this.factura().lugarExpedicion,
      observaciones: this.factura().observaciones
    })

    const fechaEmisionDate = this.getFechaEmisionInicial();
    this.flatpickrEmisionInstance.setDate( fechaEmisionDate, false );
    this.cancelarForm.controls.fechaEmision.setValue( fechaEmisionDate.toString() )

    this.loadingConceptos = false;

  }

  removeConcepto(index: any): void {

    this.conceptosFormArray.removeAt(index);

     this.conceptosFormArray.markAllAsTouched()

    if( this.conceptosFormArray.invalid){
      this.toastService.showToast("Por favor, corrige los errores en los conceptos antes de guardar.", EnumEstatusToast.WARNING)
      return
    }

    this.cancelarForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  agregarConceptoToArray( conceptoTable: ConceptoTable ){

    const conceptosFormArray = this.cancelarForm.get('conceptos') as FormArray<FormGroup>;

    const existingConceptoIndex = conceptosFormArray.controls.findIndex(
      (control: FormGroup) => control.value.id_producto_servicio === conceptoTable.id_producto_servicio
    );

    if( existingConceptoIndex > -1){

      const existingConceptoGroup = conceptosFormArray.at(existingConceptoIndex) as FormGroup;
      const currentCantidad = existingConceptoGroup.get('cantidad')?.value || 0;
      const newCantidad = Number( currentCantidad ) + 1; // Aumenta por la cantidad que intentabas agregar

      existingConceptoGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createConceptoGroupNewTable( conceptoTable );

      newItem.get('cantidad')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));
      newItem.get('costoUnitario')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));

      this.conceptosFormArray.push(newItem);

    }

    this.cancelarForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  async onSubmit(){

    try{

      const claveSatCancelacionMotivo = this.cancelarForm.get('claveSatCancelacionMotivo')?.value;

      if( claveSatCancelacionMotivo == ''){
        this.toastService.showToast("Por favor, elige el motivo de cancelación.", EnumEstatusToast.WARNING);
        return;
      }

      if( claveSatCancelacionMotivo === EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION && this.seccion !== EnumSeccion.PREVISUALIZACION ){
        this.toastService.showToast("Debes estar en la Previsualización para poder emitir la Cancelación.", EnumEstatusToast.WARNING);
        return;
      }

      let conceptosDto: ConceptoDto[] | null = null;
      let createCancelacionDto: CreateCancelacionDto | null = null;

      const fechaEmision = this.cancelarForm.controls.fechaEmision.value;

      //if( claveSatCancelacionMotivo !== EnumSatCancelacionMotivo.COMPROBANTE_EMITIDO_CON_ERRORES_CON_RELACION ){

        createCancelacionDto = {
            claveSatCancelacionMotivo: this.cancelarForm.get('claveSatCancelacionMotivo')?.value as EnumSatCancelacionMotivo,
            id_factura: this.factura().id,
            uuid_factura: this.factura().uuid,

            fechaEmision: fechaEmision ? FormUtils.fechaToUtcFromLocal( new Date( fechaEmision), this.authService.user()!.zonaHoraria!.clave ) : null

          }

      //}

      /*claveSatCancelacionMotivo: EnumSatCancelacionMotivo;
        id_factura: string;
        uuid_factura: string
        claveSatMetodoPago: EnumSatMetodoPago
        fechaEmision: Date;
        claveSatFormaPago: EnumSatFormaPago;
        condicionesPago: string;
        lugarExpedicion: string;
        observaciones: string;
        conceptos: ConceptoDto[];*/

      const respuesta = await firstValueFrom(
        this.facturasService.cancelar( createCancelacionDto ).pipe( delay(1200))
      )

      this.toastService.showToast(`Se canceló correctamente la factura con Id: ${ this.factura().id.toUpperCase() }`)

      this.router.navigate(['/operaciones/ordenes/'])

    }catch(error:any){
      this.toastService.showToastErrors(error)
    }

  }

  controlResetValue( controlKey: string, value: any, fecha = false ){

    const control = this.cancelarForm.get(controlKey);
    if(!control){
      return;
    }

    if (fecha){
      control.reset( FormUtils.formatIsoStringToLocalDisplay( value ) )
      return
    }

    control.reset(value);

  }

  controlResetValueFactura( ){

    this.cancelarForm.patchValue({
      fechaEmision: FormUtils.formatIsoStringToLocalDisplay( this.factura().fechaEmision?.toString() ),
      claveSatMetodoPago: this.factura().satMetodoPago.clave,
      condicionesPago: this.factura().condicionesPago,
      claveSatFormaPago: this.factura().satFormaPago.clave,
      lugarExpedicion: this.factura().lugarExpedicion,
      observaciones: this.factura().observaciones,
      conceptos: this.factura().conceptos
    })

  }

  filtrarProductoServicio(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.productosServiciosRXResource.hasValue() ){

          if( this.productosServiciosRXResource.value.length ){

            this.productosServiciosRXResource.set({page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, productosServicios: []})

          }

          return

        }

        return;
      }

      this.textoFiltrarProductoServicio.set( event )
    }, 300)

  }

  elegirSeccion( nuevaSeccion: EnumSeccion ){

    this.seccion = nuevaSeccion

    if( nuevaSeccion === EnumSeccion.PREVISUALIZACION ){
      this.cargarPrevisualizacion();
      this.asignarConceptosPlano();
    }

  }

  cargarPrevisualizacion(){

    const claveMetodoPago = this.cancelarForm.get('claveSatMetodoPago')?.value;
    const satMetodoPago = this.satMetodosPagosRXResource.value()?.satMetodosPagos.find( mP => mP.clave === claveMetodoPago )
    this.previsualizacion.metodoPagoDescripcion = satMetodoPago?.clave + ' - ' + satMetodoPago?.descripcion;

    //const claveMetodoPago = this.cancelarForm.get('claveSatMetodoPago')?.value;
    //const satMetodoPago = this.satMetodosPagosRXResource.value()?.satMetodosPagos.find( mP => mP.clave === claveMetodoPago )
    this.previsualizacion.fechaEmision = this.cancelarForm.get('fechaEmision')?.value?.toString() || '';

    const claveFormaPago = this.cancelarForm.get('claveSatFormaPago')?.value;
    const satFormaPago = this.satFormasPagosRXResource.value()?.satFormasPagos.find( fP => fP.clave === claveFormaPago )
    this.previsualizacion.formaPagoDescripcion = satFormaPago?.clave + ' - ' + satFormaPago?.descripcion;

    this.previsualizacion.condicionesPago = this.cancelarForm.get('condicionesPago')?.value?.toString() || '';

    this.previsualizacion.lugarExpedicion = this.cancelarForm.get('lugarExpedicion')?.value?.toString() || '';

    this.previsualizacion.observaciones = this.cancelarForm.get('observaciones')?.value?.toString() || '';

  }

  private mapConceptoBDToOptionTable( concepto: FacturaConcepto  ){

    return {
      id_producto_servicio: concepto.productoServicio.id,
      tipo: concepto.productoServicio.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: concepto.cantidad,
      descripcion: concepto.productoServicio.descripcion,
      costoUnitario: concepto.costoUnitario
    }

  }

  private mapConceptoFrontToOptionTable(concepto: any){

    /*return {
      id_producto_servicio: concepto.id,
      tipo: concepto.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: 1,
      descripcion: concepto.descripcion,
      costoUnitario: concepto.costoUnitario
    }*/

     return {
      id_producto_servicio: concepto.id,
      tipo: concepto.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: 1,
      descripcion: concepto.descripcion,
      costoUnitario: concepto.costoUnitario
    }

  }

  private createConceptoGroupNewTable(option?: ConceptoTable): FormGroup {
    const cantidad = option?.cantidad || 1;
    const costoUnitario = option?.costoUnitario || 0;
    return this.fb.group({
      id_producto_servicio: [option?.id_producto_servicio || '', Validators.required],
      tipo: [ option?.tipo ],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      costoUnitario: [costoUnitario, [Validators.required, Validators.min(0)]],
      importe: [cantidad * costoUnitario] // El importe se calculará después
    });
  }

  private updateConceptoImporte(itemGroup: FormGroup): void {
    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const costoUnitario = itemGroup.get('costoUnitario')?.value || 0;
    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false }); // emitEvent: false para evitar bucles infinitos

    //this.asignarConceptosPlano()
  }

  asignarConceptosPlano(){

    const conceptosPlano = this.conceptosFormArray.value.map( c => ({
        tipoSatTipoProductoServicio: c.tipo,
        descripcionProductoServicio: c.descripcion,
        cantidad: c.cantidad.toString(),
        costoUnitario: c.costoUnitario.toString(),
        idProductoServicio: c.id_producto_servicio
    }))

    this.conceptosPlanoSignal.set( conceptosPlano )
  }

  optionSelectedProductoServicio( option: ProductoServicio){

      const conceptoTable = this.mapConceptoFrontToOptionTable( option )

      this.agregarConceptoToArray( conceptoTable )

      this.pageFormControlSearchTableGenericaNew.hideDropdown();
  }

  /*
  async onUpdateConceptos(){

    this.conceptosFormArray.markAllAsTouched()

    if( this.conceptosFormArray.invalid){
      this.toastService.showToast("Por favor, corrige los errores en los conceptos antes de guardar.", EnumEstatusToast.WARNING)
      return
    }

    const conceptosParaEnviar = this.conceptosFormArray.value.map(
      concepto => {

        return {
          id_producto_servicio: concepto.id_producto_servicio,
          cantidad: concepto.cantidad,
          costoUnitario: concepto.costoUnitario
        }

      }
    )

    try{

      const udpateOrden = await firstValueFrom(
        this.ordenesService.updateOrdenConceptos( this.orden()!.id, conceptosParaEnviar )
      )

      this.toastService.showToast( "Conceptos de la orden actualizados correctamente.", EnumEstatusToast.SUCCESS )

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

  }
  */

  optionSelectedMetodoPago(optionClave: string){

    this.cancelarForm.patchValue({
      claveSatMetodoPago: optionClave,
      claveSatFormaPago: optionClave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ? "" : "99",
      condicionesPago: optionClave === EnumSatMetodoPago.PUE_PAGO_EN_UNA_SOLA_EXHIBICION ? "Contado" : "Crédito por 30 días"
    })

  }

  optionSelectedFormaPago(optionClave: string){

    this.cancelarForm.patchValue({
      claveSatFormaPago: optionClave
    })

  }

  satCancelacionesMotivosRXResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatCancelacionesMotivos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  productosServiciosRXResource = rxResource({
    //params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrarProductoServicio() }),
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarProductoServicio() }),
    stream: ({params}) =>{
      return this.productosServiciosService.getProductosServicios({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  satMetodosPagosRXResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatMetodosPagos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  satFormasPagosRXResource = rxResource({

    params: () => ({page: 1, limit: 24, filtro: '' }),
    stream: ({params}) => {
      return this.satService.getSatFormasPagos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

}
