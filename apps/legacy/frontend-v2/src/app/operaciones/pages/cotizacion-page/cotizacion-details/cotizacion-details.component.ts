import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, linkedSignal, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { CardVehiculoComponent } from '@catalogos/components/cards/card-vehiculo/card-vehiculo.component';
import { FormUtils } from '@shared/utils/form-utils';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { ToastService } from '@shared/services/toast.service';
import { PageFormControlSearchTableGenericaNewComponent } from "@shared/components/forms/page-form-control-search-table-generica-new/page-form-control-search-table-generica-new.component";
import { rxResource } from '@angular/core/rxjs-interop';
import { PageFormControlSearchTableGenericaSimpleComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple/page-form-control-search-table-generica-simple.component";
import { EnumCategoria, EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { AuthService } from '@auth/services/auth.service';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { CotizacionesService } from '@operaciones/services/cotizaciones.service';
import { ClientesService } from '@catalogos/services/clientes.service';
import { ClientesBusquedaTableComponent } from '@catalogos/components/tables/clientes-busqueda-table/clientes-busqueda-table.component';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { EmpresasService } from '@catalogos/services/empresas.service';
import { EmpresasBusquedaTableComponent } from '@catalogos/components/tables/empresas-busqueda-table/empresas-busqueda-table.component';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { VehiculosBusquedaTableComponent } from '@catalogos/components/tables/vehiculos-busqueda-table/vehiculos-busqueda-table.component';
import { NgIcon } from '@ng-icons/core';
import { PageFormControlSearchListComponent } from "@shared/components/forms/page-form-control-search-list/page-form-control-search-list.component";
import { MarcasService } from '@catalogos/services/marcas.service';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';
import { ProductosServiciosBusquedaTableComponent } from '@catalogos/components/tables/productos-servicios-busqueda-table/productos-servicios-busqueda-table.component';
import { ConceptosTableComponent } from '@catalogos/components/tables/conceptos-table/conceptos-table.component';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';

export interface ConceptoTable{
  id_producto_servicio: string;
  tipo: string;
  descripcion: string;
  cantidad: number,
  costoUnitario: number;
}

@Component({
  selector: 'app-cotizacion-details',
  imports: [CommonModule, NgIcon, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, CardClienteComponent, CardVehiculoComponent, FormErrorLabelComponent, CardEmpresaComponent, ProductosServiciosBusquedaTableComponent, ConceptosTableComponent, PageFormControlSearchTableGenericaSimpleComponent,
    ClientesBusquedaTableComponent, EmpresasBusquedaTableComponent, VehiculosBusquedaTableComponent, PageFormControlSearchListComponent],
  templateUrl: './cotizacion-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionDetailsComponent implements AfterViewInit {

  cotizacion = input.required<Cotizacion | null>();

  @ViewChild('pageFormControlSearchTableGenericaNewConceptos', {static: false}) pageFormControlSearchTableGenericaNewConceptos!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewCliente', {static: false}) pageFormControlSearchTableGenericaNewCliente!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewEmpresa', {static: false}) pageFormControlSearchTableGenericaNewEmpresa!: PageFormControlSearchTableGenericaNewComponent;
  @ViewChild('pageFormControlSearchTableGenericaNewVehiculo', {static: false}) pageFormControlSearchTableGenericaNewVehiculo!: PageFormControlSearchTableGenericaNewComponent;

  fb = inject(FormBuilder);
  router = inject(Router);

  cotizacionesService = inject(CotizacionesService);
  productosServiciosService = inject(ProductosServiciosService);
  clientesService = inject(ClientesService);
  empresasService = inject(EmpresasService);
  vehiculosService = inject(VehiculosService);
  marcasService = inject(MarcasService);

  toastService = inject(ToastService);
  authService = inject(AuthService);

  textoFiltrarProductoServicio = signal('')
  textoFiltrarCliente = signal('')
  textoFiltrarEmpresa = signal('')
  textoFiltrarVehiculo = signal('')

  plusButtonMostrarCliente = signal(true);
  plusButtonMostrarEmpresa = signal(true);
  plusButtonMostrarVehiculo = signal(true);

  pagoIndividual = signal<boolean>(true);
  mostrarCliente = signal<boolean>(true);
  mostrarVehiculo = signal<boolean>(true);

  //marcaSelected = linkedSignal(() => this.vehiculo().modelo?.marca?.id || '' )
  marcaSelected = linkedSignal( () => this.cotizacion()?.modelo?.marca?.id || null);
  modeloSelected = linkedSignal( () => this.cotizacion()?.modelo?.id || null);

  clienteSeleccionado: Cliente | null = null;
  empresaSeleccionado: Empresa | null = null;
  vehiculoSeleccionado: Vehiculo | null = null;

  private debounceTimer: any

  cotizacionForm = this.fb.group({
    id_cliente:   ['', []],
    id_empresa:   ['', []],
    id_vehiculo:  ['', []],
    id_modelo:    ['', []],
    anio:         ['', []],
    descripcion:  ['', [Validators.required]],
    conceptos: this.fb.array<FormGroup>([])
  })

  /*constructor( private cdr: ChangeDetectorRef){
  }*/

  ngAfterViewInit(){

    if( this.cotizacion()?.orden ){

      this.toastService.showToast(`La Cotización con ID: ${ this.cotizacion()?.id.toUpperCase() } pertenece a la Orden con ID: ${this.cotizacion()?.orden!.id.toUpperCase() } y no se puede modificar`, EnumEstatusToast.WARNING);
      this.router.navigate(["/operaciones/cotizaciones"])

    }

    this.setFormValue()
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get cotizacionCliente(){
    return this.cotizacion() ? this.cotizacion()!.cliente : this.clienteSeleccionado;
  }

  get cotizacionEmpresa(){
    return this.cotizacion() ? this.cotizacion()!.empresa : this.empresaSeleccionado;
  }

  get cotizacionVehiculo(){
    return this.cotizacion() ? this.cotizacion()?.vehiculo : this.vehiculoSeleccionado;
  }

  get conceptosFormArray(): FormArray<FormGroup>{
    return this.cotizacionForm.get('conceptos') as FormArray
  }

  get modelosByMarca(){
    return this.marcasRXResource.value()?.marcas?.find( marca => marca.id === this.marcaSelected() )?.modelos ?? []
  }

  setFormValue(){

    this.cotizacionForm.reset( this.cotizacion() as any )

    this.cotizacionForm.patchValue({
      id_cliente:   this.cotizacion() ? this.cotizacion()!.cliente?.id  : this.clienteSeleccionado?.id  ?? null,
      id_empresa:   this.cotizacion() ? this.cotizacion()!.empresa?.id  : this.empresaSeleccionado?.id  ?? null,
      id_vehiculo:  this.cotizacion() ? this.cotizacion()!.vehiculo?.id : this.vehiculoSeleccionado?.id ?? null

    })

    if( this.cotizacion() ){

      this.setMostrarCliente( !!this.cotizacion()?.cliente )

      this.setMostrarVehiculo( !!this.cotizacion()?.vehiculo )

    }


    const conceptos: any[] = []

    this.cotizacion()?.conceptos.forEach( concepto => {

      const conceptoTable = this.mapConceptoBDToOptionTable( concepto )

      this.agregarConceptoToArray( conceptoTable )

    })

  }

  setMostrarCliente( value: boolean){

    //this.pagoIndividual.set( value );
    this.mostrarCliente.set( value );

    //this.complementoPagoForm.get('monto')?.reset('0');

    if( value == false ){
      //await this.cargarFacturasSinLiquidar();
      //this.complementoPagoForm.get('monto')?.disable();
    }else{
      //this.complementoPagoForm.get('monto')?.enable();
    }

  }

  setMostrarVehiculo( value: boolean){

    this.mostrarVehiculo.set( value );

    //this.complementoPagoForm.get('monto')?.reset('0');

    if( value == false ){
      //await this.cargarFacturasSinLiquidar();
      //this.complementoPagoForm.get('monto')?.disable();
    }else{
      //this.complementoPagoForm.get('monto')?.enable();
    }

  }

  setPagoIndividual( value: boolean){

    this.pagoIndividual.set( value );

    //this.complementoPagoForm.get('monto')?.reset('0');

    if( value == false ){
      //await this.cargarFacturasSinLiquidar();
      //this.complementoPagoForm.get('monto')?.disable();
    }else{
      //this.complementoPagoForm.get('monto')?.enable();
    }

  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  limpiarEmpresaSeleccionado(){
    this.cotizacionesService.empresaSeleccionado = null;
  }

  private mapConceptoBDToOptionTable( concepto: any  ){

    return {
      id_producto_servicio: concepto.productoServicio.id,
      tipo: concepto.productoServicio.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: concepto.cantidad,
      descripcion: concepto.productoServicio.descripcion,
      costoUnitario: concepto.costoUnitario
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

  // Método para recalcular el importe de un ítem
  private updateConceptoImporte(itemGroup: FormGroup): void {
    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const costoUnitario = itemGroup.get('costoUnitario')?.value || 0;

    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false }); // emitEvent: false para evitar bucles infinitos
  }

  removeConcepto(index: any): void {

    this.conceptosFormArray.removeAt(index);
    this.cotizacionForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  async onSubmit(){

    this.cotizacionForm.markAllAsTouched();

    const isValid = this.cotizacionForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    if( this.cotizacion()?.orden ){
      this.toastService.showToast("No es posible modificar la cotización.", EnumEstatusToast.WARNING);
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

    const id_cliente = this.cotizacionForm.value.id_cliente || null
    const id_empresa = this.cotizacionForm.value.id_empresa || null
    const id_vehiculo = this.cotizacionForm.value.id_vehiculo || null
    const id_modelo = this.cotizacionForm.value.id_modelo || null
    const anio = this.cotizacionForm.value.anio || null
    const descripcion = this.cotizacionForm.value.descripcion || null
    const conceptos = this.cotizacionForm.value.conceptos || []

    if( !id_cliente && !id_empresa ){
      this.toastService.showToast("Debes elegir un Cliente ó una Empresa", EnumEstatusToast.WARNING);
      return;
    }

    if( conceptos.length === 0){
      this.toastService.showToast("Debes seleccionar al menos un concepto", EnumEstatusToast.WARNING);
      return;
    }

    const cotizacionLike: Partial<Cotizacion> = {

      ...( this.cotizacionForm.value as any ),
      //fechaIngreso:             FormUtils.fechaToUtcFromLocal( new Date( fechaIngreso! ), this.authService.user()!.zonaHoraria!.clave ),
      //fechaEntregaEstimada:     FormUtils.fechaToUtcFromLocal( new Date(fechaEntregaEstimada!), this.authService.user()!.zonaHoraria!.clave ),
      //fechaEntregaReal:         fechaEntregaReal ? FormUtils.fechaToUtcFromLocal( new Date(fechaEntregaReal), this.authService.user()!.zonaHoraria!.clave ) : null,
      conceptos: conceptosParaEnviar

    }


    if( !this.cotizacion()){

      try{

        if( !id_vehiculo && ( !id_modelo || !anio ) ){
          this.toastService.showToast("Debes elegir un Vehículo ó una Marca, Modelo y Año", EnumEstatusToast.WARNING);
          return;
        }

        const cotizacion = await firstValueFrom(
          this.cotizacionesService.createCotizacion( cotizacionLike )
        )

        this.toastService.showToast("Se guardó correctamente la nueva cotizacion")

        this.router.navigate(['/operaciones/cotizaciones/'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        if( !descripcion ){
            this.toastService.showToast("Debes ingresar una descripción", EnumEstatusToast.WARNING);
            return;
        }

        const cotizacion = await firstValueFrom(
          this.cotizacionesService.updateCotizacion( this.cotizacion()!.id, { descripcion })
        )

        this.toastService.showToast("Se actualizó correctamente la cotizacion")

        this.router.navigate(['/operaciones/cotizaciones/'])

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

    const conceptosFormArray = this.cotizacionForm.get('conceptos') as FormArray<FormGroup>;

    const existingConceptoIndex = conceptosFormArray.controls.findIndex(
      (control: FormGroup) => control.value.id_producto_servicio === conceptoTable.id_producto_servicio
    );

    // 1. Buscar si el concepto ya existe en el FormArray
    //const existingConceptoIndex = conceptosFormArray.controls.findIndex(
    //  (control: ConceptoFormGroup) => control.value.id_producto_servicio === conceptoTable.id_producto_servicio
    //);

    if( existingConceptoIndex > -1){

      const existingConceptoGroup = conceptosFormArray.at(existingConceptoIndex) as FormGroup;
      const currentCantidad = existingConceptoGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1; // Aumenta por la cantidad que intentabas agregar

      existingConceptoGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createConceptoGroupNewTable( conceptoTable );

      newItem.get('cantidad')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));
      newItem.get('costoUnitario')?.valueChanges.subscribe(() => this.updateConceptoImporte(newItem));

      this.conceptosFormArray.push(newItem);

    }

    this.cotizacionForm.setControl('conceptos', this.fb.array<FormGroup>(this.conceptosFormArray.controls as FormGroup[]));

  }

  optionSelectedProductoServicio( option: ProductoServicio){

    const conceptoTable = this.mapConceptoFrontToOptionTable( option )

    this.agregarConceptoToArray( conceptoTable )

    this.pageFormControlSearchTableGenericaNewConceptos.hideDropdown();

  }

  optionSelectedCliente( option: Cliente){

    this.cotizacionForm.patchValue({
      id_cliente: option.id,
      id_empresa: null
    })

    this.clienteSeleccionado = option;
    this.empresaSeleccionado = null;


    this.pageFormControlSearchTableGenericaNewCliente.hideDropdown();

    this.plusButtonMostrarCliente.set( false );
    this.plusButtonMostrarEmpresa.set( true );

  }

  optionSelectedEmpresa( option: Empresa){

    this.cotizacionForm.patchValue({
      id_empresa: option.id,
      id_cliente: null,
    })

    this.empresaSeleccionado = option;
    this.clienteSeleccionado = null;

    this.pageFormControlSearchTableGenericaNewEmpresa.hideDropdown();
    this.plusButtonMostrarEmpresa.set( false );
    this.plusButtonMostrarCliente.set( true );

  }

  optionSelectedVehiculo( option: Vehiculo){

    this.cotizacionForm.patchValue({
      id_vehiculo: option.id,
      id_modelo: null,
      anio: null
    })

    this.vehiculoSeleccionado = option;

    this.marcaSelected.set(null)
    this.modeloSelected.set(null)

    this.pageFormControlSearchTableGenericaNewVehiculo.hideDropdown();
    this.plusButtonMostrarVehiculo.set( false );

  }

  optionSelectedMarca( optionId: string){

    this.marcaSelected.set( optionId );

    this.cotizacionForm.patchValue({
      id_vehiculo: null
    })

    this.vehiculoSeleccionado = null;
    this.plusButtonMostrarVehiculo.set( true );

  }

  optionSelectedModelo( optionId: string){

    this.cotizacionForm.patchValue({
      id_modelo: optionId,
      id_vehiculo: null
    })

    this.modeloSelected.set( optionId );

    this.vehiculoSeleccionado = null;
    this.plusButtonMostrarVehiculo.set( true );

  }

  limpiarCliente(){

    this.clienteSeleccionado = null;
    if( this.cotizacion() ) this.cotizacion()!.cliente = null;

    this.cotizacionForm.patchValue({
      id_cliente: null
    })

    this.plusButtonMostrarCliente.set(true);

  }

  limpiarEmpresa(){

    this.empresaSeleccionado = null;
    if( this.cotizacion() ) this.cotizacion()!.empresa = null;

    this.cotizacionForm.patchValue({
      id_empresa: null
    })

    this.plusButtonMostrarEmpresa.set(true);

  }

  limpiarVehiculo(){

    this.vehiculoSeleccionado = null;
    if( this.cotizacion() ) this.cotizacion()!.vehiculo = null;

    this.cotizacionForm.patchValue({
      id_vehiculo: null
    })

    this.plusButtonMostrarVehiculo.set(true);

  }

  async onUpdateConceptos(){

    if( !this.cotizacion() ){
      this.toastService.showToast("Primero debes guardar la cotizacion para poder actualizar sus conceptos.", EnumEstatusToast.WARNING)
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

      const idCotizacionUpdated = await firstValueFrom(
        this.cotizacionesService.updateCotizacionConceptos( this.cotizacion()!.id, conceptosParaEnviar )
      )

      this.toastService.showToast( "Conceptos de la cotizacion actualizados correctamente.", EnumEstatusToast.SUCCESS )

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

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

  marcasRXResource = rxResource({
    params: () => ({}),
    stream: () => {
      return this.marcasService.getMarcasAll()
      //.pipe(
      //  tap( resp => this.marcaSelected.set( this.cotizacion()!.modelo?.marca?.id || '' ) )
      //)
    }
  })

 }
