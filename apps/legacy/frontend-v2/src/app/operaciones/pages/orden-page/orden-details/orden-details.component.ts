import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { CardVehiculoComponent } from '@catalogos/components/cards/card-vehiculo/card-vehiculo.component';
import { FormUtils } from '@shared/utils/form-utils';
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { ToastService } from '@shared/services/toast.service';
import { PageFormControlSearchTableGenericaNewComponent } from "@shared/components/forms/page-form-control-search-table-generica-new/page-form-control-search-table-generica-new.component";
import { rxResource } from '@angular/core/rxjs-interop';
import { PageFormControlSearchTableGenericaSimpleComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple/page-form-control-search-table-generica-simple.component";
import { EnumBadgeSimpleColor, EnumBorderColor, EnumCategoria, EnumEstatusOrden, EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { AuthService } from '@auth/services/auth.service';
import { CotizacionesService } from '@operaciones/services/cotizaciones.service';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';
import { ConceptosTableComponent } from '@catalogos/components/tables/conceptos-table/conceptos-table.component';
import { ClientesBusquedaTableComponent } from "@catalogos/components/tables/clientes-busqueda-table/clientes-busqueda-table.component";
import { ClientesService } from '@catalogos/services/clientes.service';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { NgIcon } from "@ng-icons/core";
import { EmpresasService } from '@catalogos/services/empresas.service';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { VehiculosBusquedaTableComponent } from "@catalogos/components/tables/vehiculos-busqueda-table/vehiculos-busqueda-table.component";
import { EmpresasBusquedaTableComponent } from "@catalogos/components/tables/empresas-busqueda-table/empresas-busqueda-table.component";
import { VehiculoDetailsComponent } from '@catalogos/pages/vehiculo-page/vehiculo-details/vehiculo-details.component';
import { ClienteDetailsComponent } from '@catalogos/pages/cliente-page/cliente-details/cliente-details.component';
import { EmpresaDetailsComponent } from '@catalogos/pages/empresa-page/empresa-details/empresa-details.component';
import { DatePickerModule } from 'primeng/datepicker';
import { CardComponentToggleNuevoComponent } from '@catalogos/components/cards/card-component-toggle-nuevo/card-component-toggle-nuevo.component';
import { ProductosServiciosBusquedaTableComponent } from '@catalogos/components/tables/productos-servicios-busqueda-table/productos-servicios-busqueda-table.component';

export interface ConceptoTable{
  id_producto_servicio: string;
  tipo: string;
  descripcion: string;
  cantidad: number,
  costoUnitario: number;
}

@Component({
  selector: 'app-orden-details',
  imports: [CommonModule, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, CardClienteComponent, CardVehiculoComponent, FormErrorLabelComponent, EstatusBadgeComponent, CardEmpresaComponent, ProductosServiciosBusquedaTableComponent, ConceptosTableComponent, PageFormControlSearchTableGenericaSimpleComponent, ClientesBusquedaTableComponent, NgIcon, VehiculosBusquedaTableComponent, EmpresasBusquedaTableComponent, VehiculoDetailsComponent, ClienteDetailsComponent, EmpresaDetailsComponent, DatePickerModule, CardComponentToggleNuevoComponent, ],
  templateUrl: './orden-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenDetailsComponent implements AfterViewInit {

  orden = input.required<Orden | null>();

  @Output() limpiarOrdenVehiculoEmit = new EventEmitter<void>();
  @Output() limpiarOrdenClienteEmit = new EventEmitter<void>();
  @Output() limpiarOrdenEmpresaEmit = new EventEmitter<void>();

  readonly totalSteps = 5;
  currentStep = signal(1);
  readonly stepItems = [
    { id: 1, label: 'Vehiculo' },
    { id: 2, label: 'Cliente' },
    { id: 3, label: 'Empresa' },
    { id: 4, label: 'Conceptos' },
    { id: 5, label: 'Descripcion' },
  ];

  @ViewChild('pageFormControlSearchTableGenericaNewConcepto', {static: false}) pageFormControlSearchTableGenericaNewConcepto!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewCliente', {static: false}) pageFormControlSearchTableGenericaNewCliente!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewEmpresa', {static: false}) pageFormControlSearchTableGenericaNewEmpresa!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewVehiculo', {static: false}) pageFormControlSearchTableGenericaNewVehiculo!: PageFormControlSearchTableGenericaNewComponent;

  @ViewChild(VehiculoDetailsComponent) vehiculoDetailsComponent!: VehiculoDetailsComponent;
  @ViewChild(ClienteDetailsComponent) clienteDetailsComponent!: ClienteDetailsComponent;
  @ViewChild(EmpresaDetailsComponent) empresaDetailsComponent!: EmpresaDetailsComponent;

  fb = inject(FormBuilder);
  router = inject(Router);

  ordenesService = inject(OrdenesService);
  productosServiciosService = inject(ProductosServiciosService);
  toastService = inject(ToastService);
  authService = inject(AuthService);
  clientesService = inject(ClientesService);
  empresasService = inject(EmpresasService);
  vehiculosService = inject(VehiculosService);

  cotizacionesService = inject(CotizacionesService);

  textoFiltrarCliente = signal('')
  textoFiltrarEmpresa = signal('')
  textoFiltrarVehiculo = signal('')

  plusButtonMostrarCliente = signal(true);
  plusButtonMostrarEmpresa = signal(true);
  plusButtonMostrarVehiculo = signal(true);

  nuevoCliente = signal<boolean>(true);
  nuevoEmpresa = signal<boolean>(true);
  nuevoVehiculo = signal<boolean>(true);

  clienteSeleccionado: Cliente | null = null;
  empresaSeleccionado: Empresa | null = null;
  vehiculoSeleccionado: Vehiculo | null = null;

  textoFiltrarProductoServicio = signal('')
  private debounceTimer: any

  incluirEmpresa = signal(false);

  ordenForm = this.fb.group({
    id_vehiculo: ['', []],
    id_cliente: ['', []],
    id_empresa: ['', []],
    estatus: ['', []],
    descripcion: ['', [Validators.required]],
    fechaIngreso: [ new Date(), [Validators.required]],
    fechaEntregaReal: [null as Date | null, []],
    kilometros: ['', []],
    poliza: ['', []],
    siniestro: ['', []],
    folioNota: ['', []],
    conceptos: this.fb.array<FormGroup>([])
  })

  ngAfterViewInit(){
    this.setFormValue()
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get ordenCliente(){
    return this.orden()?.cliente || this.clienteSeleccionado;
  }

  get ordenEmpresa(){
    return this.orden()?.empresa || this.empresaSeleccionado;
  }

  get ordenVehiculo(){
    return this.orden()?.vehiculo || this.vehiculoSeleccionado;
  }

  get conceptosFormArray(): FormArray<FormGroup>{
    return this.ordenForm.get('conceptos') as FormArray
  }

  get EnumEstatusOrden(){
    return EnumEstatusOrden;
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }
  get EnumBorderColor(){
    return EnumBorderColor;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  private getFechaIngresoInicial(){

    if( !this.orden()?.fechaIngreso ){
      return new Date();
    }

    return new Date( this.orden()!.fechaIngreso! )
  }

  private getFechaEntregaRealInicial(){

    if( !this.orden()?.fechaEntregaReal ){
      return null
    }

    return new Date( this.orden()!.fechaEntregaReal! );
  }

  async setFormValue(){
    this.ordenForm.reset( this.orden() as any )

    let descripcion = '';

    if( !this.orden() && this.ordenesService.cotizacionIdSeleccionado ){
      const cotizacion = await firstValueFrom(
          this.cotizacionesService.getCotizacion( this.ordenesService.cotizacionIdSeleccionado! )
      )

      if( cotizacion ){

        this.clienteSeleccionado = cotizacion.cliente;
        this.empresaSeleccionado = cotizacion.empresa;
        this.vehiculoSeleccionado = cotizacion.vehiculo;
        descripcion = `Orden generada por la cotización: ${this.ordenesService.cotizacionIdSeleccionado?.toLocaleUpperCase()}.  ${cotizacion.descripcion}`
        cotizacion.conceptos.forEach( concepto => {

          const conceptoTable = this.mapConceptoBDToOptionTable( concepto )

          this.agregarConceptoToArray( conceptoTable )

        })

      }
    }

    this.ordenForm.patchValue({
      id_cliente:  this.orden() ?  this.orden()!.cliente?.id :   this.clienteSeleccionado?.id,
      id_empresa:  this.orden() ?  this.orden()!.empresa?.id :   this.empresaSeleccionado?.id,
      id_vehiculo: this.orden() ?  this.orden()!.vehiculo?.id :  this.vehiculoSeleccionado?.id,
      descripcion: this.orden() ?  this.orden()!.descripcion :   descripcion,
    })

    const fechaIngresoDate = this.getFechaIngresoInicial();
    const fechaEntregaRealDate = this.getFechaEntregaRealInicial();

    this.ordenForm.controls.fechaIngreso.setValue( fechaIngresoDate );
    this.ordenForm.controls.fechaEntregaReal.setValue( fechaEntregaRealDate );

    if( this.orden() ){
      this.nuevoVehiculo.set(false)

      if( this.orden()?.cliente ) this.nuevoCliente.set(false);
      if( this.orden()?.empresa ) this.nuevoEmpresa.set(false);

      this.orden()!.conceptos.forEach( concepto => {

        const conceptoTable = this.mapConceptoBDToOptionTable( concepto )

        this.agregarConceptoToArray( conceptoTable )

      })

    }

  }

  private isTruthyValue(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private isVehiculoStepValid(): boolean {

    //Al cambiar el step, el componente vehiculoDetailsClomponent deja de existir

    return !!this.ordenVehiculo || this.vehiculoDetailsComponent?.vehiculoForm?.valid

  }

  private isClienteStepValid(): boolean {
    return !!this.ordenCliente || this.clienteDetailsComponent?.clienteForm?.valid
    //return this.isTruthyValue(this.ordenForm.controls.id_cliente.value);
  }

  private isEmpresaStepValid(): boolean {
    if (!this.incluirEmpresa()) return true;
    return !!this.ordenEmpresa || this.empresaDetailsComponent?.empresaForm?.valid
    //return this.isTruthyValue(this.ordenForm.controls.id_empresa.value);
  }

  private isConceptosStepValid(): boolean {
    return this.conceptosFormArray.length > 0;
  }

  private isDescripcionStepValid(): boolean {
    return this.ordenForm.controls.descripcion.valid && this.ordenForm.controls.fechaIngreso.valid;
  }

  private isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isVehiculoStepValid();
      case 2:
        return this.isClienteStepValid();
      case 3:
        return this.isEmpresaStepValid();
      case 4:
        return this.isConceptosStepValid();
      case 5:
        return this.isDescripcionStepValid();
      default:
        return false;
    }
  }

  canAdvanceFromStep(step: number, showToast = false): boolean {
    const isValid = this.isStepValid(step);
    if (isValid) return true;

    if (step === 5) {
      this.ordenForm.controls.descripcion.markAsTouched();
      this.ordenForm.controls.fechaIngreso.markAsTouched();
    }
    if (showToast) {
      this.toastService.showToast('Completa la información del paso actual para continuar.', EnumEstatusToast.WARNING);
    }
    return false;
  }

  canAccessStep(step: number): boolean {
    if (step < 1 || step > this.totalSteps) return false;
    for (let i = 1; i < step; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep() > step && this.isStepValid(step);
  }

  isStepActive(step: number): boolean {
    return this.currentStep() === step;
  }

  isStepLocked(step: number): boolean {
    return !this.canAccessStep(step);
  }

  get stepProgress(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }

  goToStep(step: number): void {
    if (this.canAccessStep(step)) {
      this.currentStep.set(step);
    }
  }

  nextStep(): void {

    const step = this.currentStep();
    if (step >= this.totalSteps) return;
    if (!this.canAdvanceFromStep(step, true)) return;
    this.currentStep.set(step + 1);
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step <= 1) return;
    this.currentStep.set(step - 1);
  }

  setFormValueEstatus( clave: any ){

    this.ordenForm.patchValue({
      estatus: clave
    })

  }

  limpiarEmpresaSeleccionado(){
    this.ordenesService.empresaSeleccionado = null;
  }

  private mapConceptoBDToOptionTable( concepto: any  ){

    return {
      id_producto_servicio: concepto.productoServicio.id,
      tipo: concepto.productoServicio.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: concepto.cantidad,
      descripcion: concepto.productoServicio.descripcion,
      costoUnitario: concepto.costoUnitario.toString()
    }

  }

  private mapConceptoFrontToOptionTable(concepto: any){

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

    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false });
  }

  removeConcepto(index: any): void {

    this.conceptosFormArray.removeAt(index);
    this.ordenForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  async onSubmit(){
    if (!this.canAdvanceFromStep(1, true) || !this.canAdvanceFromStep(2, true) || !this.canAdvanceFromStep(3, true) || !this.canAdvanceFromStep(4, true) || !this.canAdvanceFromStep(5, true)) {
      return;
    }
    this.ordenForm.markAllAsTouched();

    const isValid = this.ordenForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const conceptosParaEnviar = this.conceptosFormArray.value.map(
      concepto => {

        return {
          id_producto_servicio: concepto.id_producto_servicio,
          cantidad: concepto.cantidad,
          costoUnitario: FormUtils.formatToStringDecimals( concepto.costoUnitario )
        }

      }
    )

    const fechaIngreso = this.ordenForm.controls.fechaIngreso.value;
    const fechaEntregaReal = this.ordenForm.controls.fechaEntregaReal.value;

    const ordenLike: any = {

      ...( this.ordenForm.value as any ),
      fechaIngreso:             FormUtils.fechaToUtcFromLocal( new Date( fechaIngreso! ), this.authService.user()!.zonaHoraria!.clave ),
      //fechaEntregaEstimada:     FormUtils.fechaToUtcFromLocal( new Date( fechaIngreso! ), this.authService.user()!.zonaHoraria!.clave ),
      fechaEntregaReal:         fechaEntregaReal ? FormUtils.fechaToUtcFromLocal( new Date(fechaEntregaReal), this.authService.user()!.zonaHoraria!.clave ) : null,
      conceptos: conceptosParaEnviar
    }

    if( this.nuevoVehiculo() ){
      if(!this.vehiculoDetailsComponent.vehiculoForm.valid){
        this.toastService.showToast("Debes capturar la informacion solicitada para el nuevo Vehículo", EnumEstatusToast.WARNING);
        return;
      }

      ordenLike.vehiculoForm = this.vehiculoDetailsComponent.vehiculoForm.value;
    }

    if( this.nuevoCliente() ){
      if(!this.clienteDetailsComponent.clienteForm.valid){
        this.toastService.showToast("Debes capturar la informacion solicitada para el nuevo Cliente", EnumEstatusToast.WARNING);
        return;
      }

      ordenLike.clienteForm = this.clienteDetailsComponent.clienteForm.value;
    }

    if( this.incluirEmpresa() && this.nuevoEmpresa() ){
      if(!this.empresaDetailsComponent.empresaForm.valid){
        this.toastService.showToast("Debes capturar la informacion solicitada para la nueva Empresa", EnumEstatusToast.WARNING);
        return;
      }

      ordenLike.empresaForm = this.empresaDetailsComponent.empresaForm.value;
    }

    if( !this.orden() ){

      try{

        const respuesta = await firstValueFrom(
          this.ordenesService.createOrden( ordenLike )
        )

        if( this.ordenesService.cotizacionIdSeleccionado ){

          const cotizacionLike: any = {
            id_orden: respuesta.id,
          }

          const cotizacionActualizada = await firstValueFrom(
            this.cotizacionesService.updateCotizacion( this.ordenesService.cotizacionIdSeleccionado!, cotizacionLike )
          )

          this.ordenesService.cotizacionIdSeleccionado = null;

        }

        this.toastService.showToast("Se guardó correctamente la nueva orden")

        this.router.navigate(['/operaciones/ordenes/'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const orden = await firstValueFrom(
          this.ordenesService.updateOrden( this.orden()!.id, ordenLike)
        )

        this.toastService.showToast("Se actualizó correctamente la orden")

        this.router.navigate(['/operaciones/ordenes/'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  filtrarProductoServicio(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.productosServiciosRXResource.hasValue() ){

          if( this.productosServiciosRXResource.value.length ){

            this.productosServiciosRXResource.set({page: 1, totalItems: 0, productosServicios: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarProductoServicio.set( event )
    }, 300)

  }

  filtrarClientes(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.clientesRXResource.hasValue() ){

          if( this.clientesRXResource.value.length ){

            this.clientesRXResource.set({page: 1, totalItems: 0, clientes: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarCliente.set( event )
    }, 300)

  }

  filtrarEmpresas(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.empresasRXResource.hasValue() ){

          if( this.empresasRXResource.value.length ){

            this.empresasRXResource.set({page: 1, totalItems: 0, empresas: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarEmpresa.set( event )
    }, 300)

  }

  filtrarVehiculos(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.vehiculosRXResource.hasValue() ){

          if( this.vehiculosRXResource.value.length ){

            this.vehiculosRXResource.set({page: 1, totalItems: 0, vehiculos: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarVehiculo.set( event )
    }, 300)

  }

  agregarConceptoToArray( conceptoTable: ConceptoTable ){

    const conceptosFormArray = this.ordenForm.get('conceptos') as FormArray<FormGroup>;

    const existingConceptoIndex = conceptosFormArray.controls.findIndex(
      (control: FormGroup) => control.value.id_producto_servicio === conceptoTable.id_producto_servicio
    );

    if( existingConceptoIndex > -1){

      const existingConceptoGroup = conceptosFormArray.at(existingConceptoIndex) as FormGroup;
      const currentCantidad = existingConceptoGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1;

      existingConceptoGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createConceptoGroupNewTable( conceptoTable );

      newItem.get('cantidad')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));
      newItem.get('costoUnitario')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));

      this.conceptosFormArray.push(newItem);

    }

    this.ordenForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  optionSelectedProductoServicio( option: ProductoServicio){

    const conceptoTable = this.mapConceptoFrontToOptionTable( option )

    this.agregarConceptoToArray( conceptoTable )

    this.pageFormControlSearchTableGenericaNewConcepto.hideDropdown();

  }

  async onUpdateConceptos(){

    if( !this.orden() ){
      this.toastService.showToast("Primero debes guardar la orden para poder actualizar sus conceptos.", EnumEstatusToast.WARNING)
      return
    }

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

      const idOrdenUpdated = await firstValueFrom(
        this.ordenesService.updateOrdenConceptos( this.orden()!.id, conceptosParaEnviar )
      )

      this.toastService.showToast( "Conceptos de la orden actualizados correctamente.", EnumEstatusToast.SUCCESS )

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

  }

  optionSelectedCliente( option: Cliente){

    this.ordenForm.patchValue({
      id_cliente: option.id,
    })

    this.clienteSeleccionado = option;

    this.pageFormControlSearchTableGenericaNewCliente.hideDropdown();

    this.plusButtonMostrarCliente.set( false );

    console.log("optionSelectedCliente")
    console.log("this.ordenForm.value: ")
    console.log(this.ordenForm.value)

  }

  optionSelectedEmpresa( option: Empresa){

    this.ordenForm.patchValue({
      id_empresa: option.id,
    })

    this.empresaSeleccionado = option;

    this.pageFormControlSearchTableGenericaNewEmpresa.hideDropdown();
    this.plusButtonMostrarEmpresa.set( false );

  }

  optionSelectedVehiculo( option: Vehiculo){

    this.ordenForm.patchValue({
      id_vehiculo: option.id,
    })

    this.vehiculoSeleccionado = option;

    this.pageFormControlSearchTableGenericaNewVehiculo.hideDropdown();
    this.plusButtonMostrarVehiculo.set( false );

    console.log("optionSelectedVehiculo")
    console.log("this.ordenForm.value: ")
    console.log(this.ordenForm.value)

  }

  limpiarCliente(){

    this.clienteSeleccionado = null;
    this.limpiarOrdenClienteEmit.emit();

    this.ordenForm.patchValue({
      id_cliente: null
    })

    this.plusButtonMostrarCliente.set(true);

  }

  limpiarEmpresa(){

    this.empresaSeleccionado = null;
    this.limpiarOrdenEmpresaEmit.emit();

    this.ordenForm.patchValue({
      id_empresa: null
    })

    this.plusButtonMostrarEmpresa.set(true);

  }

  limpiarVehiculo(){

    this.vehiculoSeleccionado = null;
    this.limpiarOrdenVehiculoEmit.emit();

    this.ordenForm.patchValue({
      id_vehiculo: null
    })

    this.plusButtonMostrarVehiculo.set(true);

  }

  onToggleIncluirEmpresa(event: Event) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    this.incluirEmpresa.set( isChecked );
    if (!isChecked) {
      this.nuevoEmpresa.set(false);
      this.limpiarEmpresa();
    }

  }

  setNuevoCliente( value: boolean){

    if( value ){
      this.limpiarCliente();
    }

    this.nuevoCliente.set( value );

  }

  setNuevoEmpresa( value: boolean){

    if( value ){
      this.limpiarEmpresa();
    }

    this.nuevoEmpresa.set( value );

  }

  setNuevoVehiculo( value: boolean){

    if( value ){
      this.limpiarVehiculo();
    }

    this.nuevoVehiculo.set( value );

  }

  productosServiciosRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarProductoServicio() }),
    stream: ({params}) =>{
      return this.productosServiciosService.getProductosServicios({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  clientesRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarCliente() }),
    stream: ({params}) =>{
      return this.clientesService.getClientes({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  empresasRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarEmpresa() }),
    stream: ({params}) =>{
      return this.empresasService.getEmpresas({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  vehiculosRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarVehiculo() }),
    stream: ({params}) =>{
      return this.vehiculosService.getVehiculos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

 }
