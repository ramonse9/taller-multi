import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { EnumBorderColor, EnumCategoria, EnumCeroRegistros, EnumEstatusOrden, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardOrdenComponent } from "@operaciones/components/cards/card-orden/card-orden.component";
import { NgIcon } from '@ng-icons/core';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';

import { ClienteDetailsComponent } from '@catalogos/pages/cliente-page/cliente-details/cliente-details.component';
import { EmpresaDetailsComponent } from '@catalogos/pages/empresa-page/empresa-details/empresa-details.component';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardComponentToggleNuevoComponent } from "@catalogos/components/cards/card-component-toggle-nuevo/card-component-toggle-nuevo.component";
import { VehiculoDetailsComponent } from '@catalogos/pages/vehiculo-page/vehiculo-details/vehiculo-details.component';
import { PageFormControlSearchTableGenericaSimpleComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple/page-form-control-search-table-generica-simple.component";
import { VehiculosBusquedaTableComponent } from "@catalogos/components/tables/vehiculos-busqueda-table/vehiculos-busqueda-table.component";
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { ClientesService } from '@catalogos/services/clientes.service';
import { EmpresasService } from '@catalogos/services/empresas.service';
import { PageFormControlSearchTableGenericaNewComponent } from '@shared/components/forms/page-form-control-search-table-generica-new/page-form-control-search-table-generica-new.component';
import { CardVehiculoComponent } from "@catalogos/components/cards/card-vehiculo/card-vehiculo.component";
import { ToastService } from '@shared/services/toast.service';
import { ClientesBusquedaTableComponent } from "@catalogos/components/tables/clientes-busqueda-table/clientes-busqueda-table.component";
import { CardClienteComponent } from "@catalogos/components/cards/card-cliente/card-cliente.component";
import { EmpresasBusquedaTableComponent } from "@catalogos/components/tables/empresas-busqueda-table/empresas-busqueda-table.component";
import { CardEmpresaComponent } from "@catalogos/components/cards/card-empresa/card-empresa.component";
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProductosServiciosBusquedaTableComponent } from "@catalogos/components/tables/productos-servicios-busqueda-table/productos-servicios-busqueda-table.component";
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';
import { ConceptosTableComponent } from "@catalogos/components/tables/conceptos-table/conceptos-table.component";
import { firstValueFrom } from 'rxjs';
import { ConceptoTable } from '../orden-page/orden-details/orden-details.component';
import { FormErrorLabelComponent } from "@shared/components/forms/form-error-label/form-error-label.component";
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { DatePicker } from "primeng/datepicker";
import { PageFormControlSearchTableGenericaSimpleDrawerComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple-drawer/page-form-control-search-table-generica-simple-drawer.component";
import { ProductosService } from '@inventario/services/productos.service';
import { Producto } from '@inventario/interfaces/producto.interface';
import { OrdenesProductosTableComponent } from '@operaciones/components/tables/ordenes-productos-table/ordenes-productos-table.component';
//import { DetalleProductoTable } from '@inventario/components/drawers/drawer-compra-nuevo/drawer-compra-nuevo.component';
import { CardProductoComponent } from "@inventario/components/cards/card-producto/card-producto.component";
import { OrdenesProductosServiciosTableComponent } from '@operaciones/components/tables/ordenes-productos-servicios-table/ordenes-productos-servicios-table.component';
import { ServiciosService } from '@catalogos/services/servicios.service';
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { CardServicioComponent } from '@catalogos/components/cards/card-servicio/card-servicio.component';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';

export type TipoProductoServicio = 'producto' | 'servicio'; 

export interface OrdenConceptoTable{
  id: string;
  tipo: TipoProductoServicio,
  codigoBarras?: string,
  descripcion: string;
  cantidad: number,
  precioVenta: number;
  stockActual?: number;
  stockMinimo?: number;
}

/*
export interface DetalleOrdenProductoTable{
  id_producto: string;
  codigoBarras: string,
  descripcion: string;
  cantidad: number,
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
}
*/

/*
export interface DetalleOrdenServicioTable{
  id_servicio: string;
  descripcion: string;
  cantidad: number;
  precioVenta: number;
}
*/

@Component({
  selector: 'app-ordenes-page-new',
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent, NgIcon, BusquedaGeneralComponent, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardOrdenComponent, CardComponentToggleNuevoComponent, VehiculoDetailsComponent, PageFormControlSearchTableGenericaSimpleComponent, VehiculosBusquedaTableComponent, CardVehiculoComponent, ClienteDetailsComponent, ClientesBusquedaTableComponent, CardClienteComponent, EmpresaDetailsComponent, EmpresasBusquedaTableComponent, CardEmpresaComponent, ProductosServiciosBusquedaTableComponent, ConceptosTableComponent, FormErrorLabelComponent, EstatusBadgeComponent, DatePicker, PageFormControlSearchTableGenericaSimpleDrawerComponent, OrdenesProductosTableComponent, CardProductoComponent, OrdenesProductosServiciosTableComponent, CardServicioComponent],
  templateUrl: './ordenes-page-new.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)', position: 'absolute', width: '100%' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({position: 'absolute', width: '100%'}),
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class OrdenesPageNewComponent implements AfterViewInit {

  ordenesService = inject( OrdenesService )
  paginationService = inject( PaginationService )
  router = inject(Router)
  fb = inject(FormBuilder);

  vehiculosService = inject(VehiculosService);
  clientesService = inject(ClientesService);
  empresasService = inject(EmpresasService);
  productosServiciosService = inject(ProductosServiciosService);
  productosService = inject(ProductosService);
  serviciosService = inject(ServiciosService);
  authService = inject(AuthService);

  toastService = inject(ToastService);

  @ViewChild('pageFormControlSearchTableGenericaNewConcepto', {static: false}) pageFormControlSearchTableGenericaNewConcepto!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewCliente', {static: false}) pageFormControlSearchTableGenericaNewCliente!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewEmpresa', {static: false}) pageFormControlSearchTableGenericaNewEmpresa!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewVehiculo', {static: false}) pageFormControlSearchTableGenericaNewVehiculo!: PageFormControlSearchTableGenericaNewComponent;

  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawerProductos', {static: false}) pageFormControlSearchTableGenericaSimpleDrawerProductos!: PageFormControlSearchTableGenericaSimpleDrawerComponent;
  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawerServicios', {static: false}) pageFormControlSearchTableGenericaSimpleDrawerServicios!: PageFormControlSearchTableGenericaSimpleDrawerComponent;

  @ViewChild(VehiculoDetailsComponent) vehiculoDetailsComponent!: VehiculoDetailsComponent;
  @ViewChild(ClienteDetailsComponent) clienteDetailsComponent!: ClienteDetailsComponent;
  @ViewChild(EmpresaDetailsComponent) empresaDetailsComponent!: EmpresaDetailsComponent;

  orden = signal<Orden | null>(null);

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());
  soloCards = signal( true );

  idSeleccionado = signal<string | null>(null)
  isOpenDrawer = signal(false);

  incluirEmpresa = signal(false);

  nuevoCliente = signal<boolean>(true);
  nuevoEmpresa = signal<boolean>(true);
  nuevoVehiculo = signal<boolean>(true);

  textoFiltrarCliente           = signal('')
  textoFiltrarEmpresa           = signal('')
  textoFiltrarVehiculo          = signal('')
  //textoFiltrarProductoServicio  = signal('')
  textoFiltrarProducto  = signal('')
  textoFiltrarServicio  = signal('')

  plusButtonMostrarCliente = signal(true);
  plusButtonMostrarEmpresa = signal(true);
  plusButtonMostrarVehiculo = signal(true);

  vehiculoSeleccionado: Vehiculo | null = null;
  clienteSeleccionado: Cliente | null = null;
  empresaSeleccionado: Empresa | null = null;

  destroyRef = inject(DestroyRef);

  private debounceTimer: any
  //isFiscalOpen = signal(false);
  isNuevoOpen = false

  readonly totalSteps = 5;
  currentStep = signal(1);
  readonly stepItems = [
    { id: 1, label: 'Vehiculo' },
    { id: 2, label: 'Cliente' },
    { id: 3, label: 'Empresa' },
    { id: 4, label: 'Productos y Servicios' },
    { id: 5, label: 'Descripción' },
  ];

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
    conceptos: this.fb.array<FormGroup>([]),    
  })
  //productos: this.fb.array<FormGroup>([]),
  //servicios: this.fb.array<FormGroup>([])

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusOrden(){
    return EnumEstatusOrden;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros
  }

  get stepProgress(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }

  get ordenVehiculo(){
    return this.orden()?.vehiculo || this.vehiculoSeleccionado;
  }

  get ordenCliente(){
    return this.orden()?.cliente || this.clienteSeleccionado;
  }

  get ordenEmpresa(){
    return this.orden()?.empresa || this.empresaSeleccionado;
  }

  get EnumBorderColor(){
    return EnumBorderColor;
  }

  get conceptosFormArray(): FormArray<FormGroup>{
    return this.ordenForm.get('conceptos') as FormArray<FormGroup>;
  }

  get conceptosFormArrayProductos(){
    return this.conceptosFormArray.controls.filter( control => control.value.tipo === 'producto')
  }

  get conceptosFormArrayServicios(){
    return this.conceptosFormArray.controls.filter( control => control.value.tipo === 'servicio')
  }

  /*
  get productosFormArray(): FormArray<FormGroup>{
    return this.ordenForm.get('productos') as FormArray<FormGroup>;
  }
  */

  /*
  get serviciosFormArray(): FormArray<FormGroup>{
    return this.ordenForm.get('servicios') as FormArray<FormGroup>;
  }
  */

  ngAfterViewInit(){
    this.ordenesRXResource.reload()
  }


  asignarOrden( orden: Orden | null){
    this.orden.set( orden )
    this.isNuevoOpen = true;
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



  private isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isVehiculoStepValid();
      case 2:
        return this.isClienteStepValid();
      case 3:
        return this.isEmpresaStepValid();
      case 4:
        return this.isProductosServiciosStepValid();
      case 5:
        return this.isDescripcionStepValid();
      default:
        return false;
    }
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

  private isProductosServiciosStepValid(): boolean {
    return this.conceptosFormArray.length > 0;
  }

  private isDescripcionStepValid(): boolean {
    return this.ordenForm.controls.descripcion.valid && this.ordenForm.controls.fechaIngreso.valid;
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

  private updateConceptoImporte(itemGroup: FormGroup): void {
    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const costoUnitario = itemGroup.get('costoUnitario')?.value || 0;

    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false });
  }

  private createConceptoGroupNewTable(option?: OrdenConceptoTable): FormGroup {

    const cantidad = option?.cantidad || 1;
    //const costoUnitario = option?.costoUnitario || 0;
    return this.fb.group({
      id: [option?.id || '', Validators.required],
      tipo: [ option?.tipo ],
      codigoBarras: [option?.codigoBarras || '', ],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      //costoUnitario: [costoUnitario, [Validators.required, Validators.min(1)]],
      importe: [cantidad * ( option?.precioVenta || 0 ) ], // El importe se calculará después
      precioVenta: [option?.precioVenta], // El importe se calculará después
      stockActual: [option?.stockActual || '', ],
      stockMinimo: [option?.stockMinimo || '', ],

    });


    /*
    const cantidad = option?.cantidad || 1;
    const costoUnitario = option?.costoUnitario || 0;
    return this.fb.group({
      id: [option?.id_producto_servicio || '', Validators.required],
      tipo: [ option?.tipo ],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      importe: [cantidad * costoUnitario] // El importe se calculará después
    });*/
  }

  agregarConceptoToArray( conceptoTable: OrdenConceptoTable ){
    console.log("conceptoTable: ")
    console.log(conceptoTable)

    const conceptosFormArray = this.ordenForm.get('conceptos') as FormArray<FormGroup>;

    const existingConceptoIndex = conceptosFormArray.controls.findIndex(
      (control: FormGroup) => control.value.id === conceptoTable.id
    );

    if( existingConceptoIndex > -1){

      const existingConceptoGroup = conceptosFormArray.at(existingConceptoIndex) as FormGroup;
      const currentCantidad = existingConceptoGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1;

      existingConceptoGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createConceptoGroupNewTable( conceptoTable );

      newItem.get('cantidad')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));
      //newItem.get('costoUnitario')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));

      this.conceptosFormArray.push(newItem);

    }

    //this.ordenForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  /*
  agregarDetalleToArray( detalleOrdenProductoTable: DetalleOrdenProductoTable ){

    const existingDetalleIndex = this.productosFormArray.controls.findIndex(
      (control: FormGroup) => control.getRawValue().id_producto === detalleOrdenProductoTable.id_producto
    );

    // 1. Buscar si el detalle ya existe en el FormArray
    //const existingDetalleIndex = detallesFormArray.controls.findIndex(
    //  (control: DetalleFormGroup) => control.value.id_producto_servicio === detalleTable.id_producto_servicio
    //);

    if( existingDetalleIndex > -1){

      const existingDetalleGroup = this.productosFormArray.at(existingDetalleIndex) as FormGroup;
      const currentCantidad = existingDetalleGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1; // Aumenta por la cantidad que intentabas agregar

      existingDetalleGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createDetalleGroupNewTable( detalleOrdenProductoTable );

      newItem.get('cantidad')?.valueChanges.pipe( takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateDetalleImporte(newItem));
      //newItem.get('costoUnitario')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateDetalleImporte(newItem));

      this.productosFormArray.push(newItem);

    }

  }*/

  /*
  agregarDetalleServicioToArray( detalleOrdenServicioTable: DetalleOrdenServicioTable ){

    const existingDetalleIndex = this.serviciosFormArray.controls.findIndex(
      (control: FormGroup) => control.getRawValue().id_servicio === detalleOrdenServicioTable.id_servicio
    );

    if( existingDetalleIndex > -1){

      const existingDetalleGroup = this.serviciosFormArray.at(existingDetalleIndex) as FormGroup;
      const currentCantidad = existingDetalleGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1;

      existingDetalleGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createDetalleServicioGroupNewTable( detalleOrdenServicioTable );

      newItem.get('cantidad')?.valueChanges.pipe( takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateDetalleImporte(newItem));

      this.serviciosFormArray.push(newItem);

    }

  }*/

  optionSelectedProducto( producto: Producto){

    const detalleTable = this.mapDetalleFrontToOptionTableProducto( producto )

    console.log("detalleTable")
    console.log(detalleTable)

    //this.agregarDetalleToArray( detalleTable )
    this.agregarConceptoToArray( detalleTable )

    this.pageFormControlSearchTableGenericaSimpleDrawerProductos.hideDrawer();

  }

  /*
  optionSelectedProductoServicio( option: Producto | Servicio){

    const conceptoTable = this.mapConceptoFrontToOptionTable( option )

    this.agregarConceptoToArray( conceptoTable )

    this.pageFormControlSearchTableGenericaNewConcepto.hideDropdown();

  }*/

  optionSelectedServicio( servicio: Servicio){

    const detalleTable = this.mapDetalleFrontToOptionTableServicio( servicio )


    console.log("detalleTable")
    console.log(detalleTable)

    this.agregarConceptoToArray( detalleTable )
    //this.agregarDetalleServicioToArray( detalleTable )

    this.pageFormControlSearchTableGenericaSimpleDrawerServicios.hideDrawer();

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

  limpiarCliente(){

    this.clienteSeleccionado = null;
    //TODO
    //this.limpiarOrdenClienteEmit.emit();

    this.ordenForm.patchValue({
      id_cliente: null
    })

    this.plusButtonMostrarCliente.set(true);

  }

  limpiarEmpresa(){

    this.empresaSeleccionado = null;
    //TODO
    //this.limpiarOrdenEmpresaEmit.emit();

    this.ordenForm.patchValue({
      id_empresa: null
    })

    this.plusButtonMostrarEmpresa.set(true);

  }

  limpiarVehiculo(){

    this.vehiculoSeleccionado = null;
    //TODO
    //this.limpiarOrdenVehiculoEmit.emit();

    this.ordenForm.patchValue({
      id_vehiculo: null
    })

    this.plusButtonMostrarVehiculo.set(true);

  }

  idNuevo(){
    this.idSeleccionado.set( null );
    //this.isOpenDrawer.set(true);
    //this.isFiscalOpen.set( true )
    this.isNuevoOpen = false;
  }

  idSeleccionar(id: string){
    this.idSeleccionado.set( id );
    this.isOpenDrawer.set(true);
  }

  idDeseleccionar(){
    this.isOpenDrawer.set(false);
    setTimeout(()=> this.idSeleccionado.set(null), 300 );
  }

  reload(){
    this.ordenesRXResource.reload()
  }

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange( itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/operaciones/ordenes'], {
      queryParams: { page: 1}
    })
  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/operaciones/ordenes'], {
      queryParams: { page: 1 }
    })

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

  filtrarProducto(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.productosRXResource.hasValue() ){

          if( this.productosRXResource.value.length ){

            this.productosRXResource.set({page: 1, totalItems: 0, productos: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarProducto.set( event )
    }, 300)

  }

  /*
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
  */

  private mapDetalleFrontToOptionTableProducto(producto: Producto){

    return {
      id: producto.id,
      tipo: 'producto' as TipoProductoServicio,
      cantidad: 1,
      codigoBarras: producto.codigoBarras,
      descripcion: producto.descripcion,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
    }

  }

  /*
  private mapConceptoFrontToOptionTable(concepto: any){

    return {
      id_producto_servicio: concepto.id,
      tipo: concepto.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: 1,
      descripcion: concepto.descripcion,
      costoUnitario: concepto.costoUnitario
    }

  }
  */
  
  private mapDetalleFrontToOptionTableServicio(servicio: Servicio){

    return {
      id: servicio.id,
      tipo: 'servicio' as TipoProductoServicio,
      descripcion: servicio.descripcion,
      cantidad: 1,
      precioVenta: servicio.precioVenta,
    }

  }

  removeDetalle(index: any): void {

    this.conceptosFormArray.removeAt(index);

  }

  /*
  removeServicio(index: any): void {

    this.serviciosFormArray.removeAt(index);

  }*/

  /*
  private createDetalleServicioGroupNewTable(option?: DetalleOrdenServicioTable): FormGroup {

    const cantidad = option?.cantidad || 1;
    return this.fb.group({
      id_servicio: [option?.id_servicio || '', Validators.required],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      importe: [cantidad * ( option?.precioVenta || 0 ) ],
      precioVenta: [option?.precioVenta || 0],

    });
  }
  */

  filtrarServicio(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.serviciosRXResource.hasValue() ){

          if( this.serviciosRXResource.value.length ){

            this.serviciosRXResource.set({page: 1, totalItems: 0, servicios: [], limit: 0, totalPages: 0, hasNextPage: false})

          }

          return

        }

        return;
      }

      this.textoFiltrarServicio.set( event )
    }, 300)

  }



  removeConcepto(index: any): void {

    this.conceptosFormArray.removeAt(index);
    this.ordenForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  // Método para recalcular el importe de un ítem
  private updateDetalleImporte(itemGroup: FormGroup): void {
    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const costoUnitario = itemGroup.get('costoUnitario')?.value || 0;

    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false }); // emitEvent: false para evitar bucles infinitos
  }

  /*
  private createDetalleGroupNewTable(option?: DetalleOrdenProductoTable): FormGroup {

    const cantidad = option?.cantidad || 1;
    //const costoUnitario = option?.costoUnitario || 0;
    return this.fb.group({
      id_producto: [option?.id_producto || '', Validators.required],
      //tipo: [ option?.tipo ],
      codigoBarras: [option?.codigoBarras || '', ],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      //costoUnitario: [costoUnitario, [Validators.required, Validators.min(1)]],
      importe: [cantidad * ( option?.precioVenta || 0 ) ], // El importe se calculará después
      precioVenta: [option?.precioVenta], // El importe se calculará después
      stockActual: [option?.stockActual || '', ],
      stockMinimo: [option?.stockMinimo || '', ],

    });
  }
  */

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
          id_producto_servicio: concepto.id,
          tipo: concepto.tipo,
          cantidad: concepto.cantidad,
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


    console.log( "ordenLike" )
    console.log( ordenLike )

    if( !this.orden() ){

      try{

        const respuesta = await firstValueFrom(
          this.ordenesService.createOrden( ordenLike )
        )

        /*
        if( this.ordenesService.cotizacionIdSeleccionado ){

          const cotizacionLike: any = {
            id_orden: respuesta.id,
          }

          const cotizacionActualizada = await firstValueFrom(
            this.cotizacionesService.updateCotizacion( this.ordenesService.cotizacionIdSeleccionado!, cotizacionLike )
          )

          this.ordenesService.cotizacionIdSeleccionado = null;

        }*/

        this.toastService.showToast("Se guardó correctamente la nueva orden")

        this.router.navigate(['/operaciones/ordenesnew'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const orden = await firstValueFrom(
          this.ordenesService.updateOrden( this.orden()!.id, ordenLike)
        )

        this.toastService.showToast("Se actualizó correctamente la orden")

        this.router.navigate(['/operaciones/ordenesnew'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  productosRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarProducto() }),
    stream: ({params}) =>{
      return this.productosService.getProductos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  serviciosRXResource = rxResource({
    params: () => ({ page: 1, limit: 12, filtro: this.textoFiltrarServicio() }),
    stream: ({params}) =>{
      return this.serviciosService.getServicios({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

  /*
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
  */

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

  ordenesRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar()
    }),
    stream: ({params}) => {
      return this.ordenesService.getOrdenes({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro
      })
    }
  })

}

export default OrdenesPageNewComponent;
