import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, inject, input, linkedSignal, output, signal, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormUtils } from '@shared/utils/form-utils';
import { ToastService } from '@shared/services/toast.service';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnumCategoria, EnumCeroRegistros, EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { AuthService } from '@auth/services/auth.service';
import { ComprasService } from '@inventario/services/compras.service';
import { ProductosService } from '@inventario/services/productos.service';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';
import { ProveedoresResponse } from '@catalogos/interfaces/proveedor.response';
import { ProveedoresService } from '@catalogos/services/proveedores.service';
import { ComprasProductosTableComponent } from "../../tables/compras-productos-table/compras-productos-table.component";
import { Producto } from '@inventario/interfaces/producto.interface';
import { Compra, CompraLite } from '@inventario/interfaces/compra.interface';
import { PageFormControlSearchTableGenericaSimpleDrawerComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple-drawer/page-form-control-search-table-generica-simple-drawer.component";
import { ProveedoresBusquedaTableComponent } from '@inventario/components/tables/proveedores-busqueda-table/proveedores-busqueda-table.component';
import { SpinnerService } from '@shared/services/spinner.service';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardProductoComponent } from "@inventario/components/cards/card-producto/card-producto.component";

export interface DetalleProductoTable{
  id_producto: string;
  codigoBarras: string,
  descripcion: string;
  cantidad: number,
  costoUnitario: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
}

@Component({
  selector: 'app-drawer-compra-nuevo',
  imports: [CommonModule, ReactiveFormsModule, ProveedoresBusquedaTableComponent, ComprasProductosTableComponent, PageFormControlSearchTableGenericaSimpleDrawerComponent, CardsContainerComponent, BadgeMessageComponent, CardProductoComponent],
  templateUrl: './drawer-compra-nuevo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerCompraNuevoComponent implements AfterViewInit {

  compra = input.required<CompraLite | null>();

  guardadoCorrectoEmit = output<void>();

  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawerProveedor', {static: false}) pageFormControlSearchTableGenericaSimpleDrawerProveedor!: PageFormControlSearchTableGenericaSimpleDrawerComponent;
  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawerProductos', {static: false}) pageFormControlSearchTableGenericaSimpleDrawerProductos!: PageFormControlSearchTableGenericaSimpleDrawerComponent;

  fb = inject(FormBuilder);
  router = inject(Router);

  comprasService = inject(ComprasService);
  productosService = inject(ProductosService);
  proveedoresService = inject(ProveedoresService);

  toastService = inject(ToastService);
  authService = inject(AuthService);
  spinnerService = inject(SpinnerService);

  textoFiltrarProveedor = signal('')
  textoFiltrarProducto = signal('')

  pagoIndividual = signal<boolean>(true);

  destroyRef = inject(DestroyRef);

  isLoading = this.spinnerService.isLoading$

  private debounceTimer: any

  optionSelectedProveedorValue = signal<string | null>(null)

  compraForm = this.fb.group({
    id_proveedor: ['', [Validators.required]],
    detalles: this.fb.array<FormGroup>([], [ FormUtils.minLengthArray(1) ])
  })

  //observaciones:  ['', [Validators.required]],
  ngAfterViewInit(){

    //this.setFormValue()
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get detallesFormArray(): FormArray<FormGroup>{
    return this.compraForm.get('detalles') as FormArray<FormGroup>;
  }

  setFormValue(){

    this.compraForm.reset( this.compra() as any )


    this.compra()?.detalles.forEach( detalle => {

      const detalleTable = this.mapDetalleBDToOptionTable( detalle )

      this.agregarDetalleToArray( detalleTable )

    })

  }

  setPagoIndividual( value: boolean){

    this.pagoIndividual.set( value );

  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  private mapDetalleBDToOptionTable( detalle: any  ){

    return {
      id_producto: detalle.producto.id,
      //tipo: detalle.productoServicio.satProductoServicio.satTipoProductoServicio.tipo,
      codigoBarras: detalle.producto.codigoBarras,
      cantidad: detalle.cantidad,
      descripcion: detalle.producto.descripcion,
      costoUnitario: detalle.costoUnitario,
      precioVenta: detalle.producto.precioVenta,
      stockActual: detalle.producto.stockActual,
      stockMinimo: detalle.producto.stockMinimo,
    }

  }

  private mapDetalleFrontToOptionTable(producto: Producto){

    return {
      id_producto: producto.id,
      //tipo: detalle.satProductoServicio.satTipoProductoServicio.tipo,
      cantidad: 1,
      codigoBarras: producto.codigoBarras,
      descripcion: producto.descripcion,
      costoUnitario: 0,
      precioVenta: producto.precioVenta,
      stockActual: producto.stockActual,
      stockMinimo: producto.stockMinimo,
    }

  }

  private createDetalleGroupNewTable(option?: DetalleProductoTable): FormGroup {

    const cantidad = option?.cantidad || 1;
    const costoUnitario = option?.costoUnitario || 0;
    return this.fb.group({
      id_producto: [option?.id_producto || '', Validators.required],
      //tipo: [ option?.tipo ],
      codigoBarras: [option?.codigoBarras || '', ],
      descripcion: [option?.descripcion || '', Validators.required],
      cantidad: [cantidad, [Validators.required, Validators.min(1)]],
      costoUnitario: [costoUnitario, [Validators.required, Validators.min(1)]],
      importe: [cantidad * costoUnitario], // El importe se calculará después
      precioVenta: [option?.precioVenta], // El importe se calculará después
      stockActual: [option?.stockActual || '', ],
      stockMinimo: [option?.stockMinimo || '', ],

    });
  }

  // Método para recalcular el importe de un ítem
  private updateDetalleImporte(itemGroup: FormGroup): void {
    const cantidad = itemGroup.get('cantidad')?.value || 0;
    const costoUnitario = itemGroup.get('costoUnitario')?.value || 0;

    itemGroup.get('importe')?.setValue(cantidad * costoUnitario, { emitEvent: false }); // emitEvent: false para evitar bucles infinitos
  }

  removeDetalle(index: any): void {

    this.detallesFormArray.removeAt(index);

  }

  async onSubmit(){

    this.compraForm.markAllAsTouched();

    const isValid = this.compraForm.valid

    if( !isValid ) {
      this.toastService.showToast("Debes capturar la informacion solicitada", EnumEstatusToast.WARNING);
      return;
    }

    const detallesParaEnviar = this.detallesFormArray.value.map(
      detalle => {

        return {
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          costoUnitario: FormUtils.formatToStringDecimals( detalle.costoUnitario ),
        }

      }
    )

    //const observaciones = this.compraForm.value.observaciones || null
    const detalles = this.compraForm.value.detalles || []

    if( detalles.length === 0){
      this.toastService.showToast("Debes seleccionar al menos un detalle", EnumEstatusToast.WARNING);
      return;
    }

    const compraLike: Partial<Compra> = {

      ...( this.compraForm.value as any ),
      detalles: detallesParaEnviar

    }

    if( !this.compra()){

      try{

        //if( !id_vehiculo && ( !id_modelo || !anio ) ){
        //  this.toastService.showToast("Debes elegir un Vehículo ó una Marca, Modelo y Año", EnumEstatusToast.WARNING);
        //  return;
        //}

        const compra = await firstValueFrom(
          this.comprasService.createCompra( compraLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se guardó correctamente la nueva compra")

        //this.router.navigate(['/inventario/compras/'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        /*if( !observaciones ){
            this.toastService.showToast("Debes ingresar una observación", EnumEstatusToast.WARNING);
            return;
        }*/

        /*const compra = await firstValueFrom(
          this.comprasService.updateCompra( this.compra()!.id, { observaciones })
        )*/

        this.toastService.showToast("REVISAR LA ACTUALIZACION DE LA COMPRA Se actualizó correctamente la compra")

        //this.router.navigate(['/inventario/compras/'])

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }

  }

  filtrarProducto(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length <= 2 ){

        //if( this.productosRXResource.hasValue() ){

          //if( this.productosRXResource.value().productos.length ){

            this.productosRXResource.set({page: 1, totalItems: 0, productos: [], limit: 0, totalPages: 0, hasNextPage: false})

          //}

          //return

        //}

        return;
      }

      this.textoFiltrarProducto.set( event )
    }, 300)

  }

  filtrarProveedor(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length <= 2 ){

        //if( this.proveedoresRXResource.hasValue() ){

          //if( this.proveedoresRXResource.value.length ){

            this.proveedoresRXResource.set({page: 1, totalItems: 0, proveedores: [], limit: 0, totalPages: 0, hasNextPage: false})

          //}

          //return

        //}

        return;
      }

      this.textoFiltrarProveedor.set( event )
    }, 300)

  }

  agregarDetalleToArray( detalleTable: DetalleProductoTable ){

    const existingDetalleIndex = this.detallesFormArray.controls.findIndex(
      (control: FormGroup) => control.getRawValue().id_producto === detalleTable.id_producto
    );

    // 1. Buscar si el detalle ya existe en el FormArray
    //const existingDetalleIndex = detallesFormArray.controls.findIndex(
    //  (control: DetalleFormGroup) => control.value.id_producto_servicio === detalleTable.id_producto_servicio
    //);

    if( existingDetalleIndex > -1){

      const existingDetalleGroup = this.detallesFormArray.at(existingDetalleIndex) as FormGroup;
      const currentCantidad = existingDetalleGroup.get('cantidad')?.value || 0;
      const newCantidad = currentCantidad + 1; // Aumenta por la cantidad que intentabas agregar

      existingDetalleGroup.get('cantidad')?.setValue(newCantidad);

    }else{

      const newItem = this.createDetalleGroupNewTable( detalleTable );

      newItem.get('cantidad')?.valueChanges.pipe( takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateDetalleImporte(newItem));
      newItem.get('costoUnitario')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateDetalleImporte(newItem));

      this.detallesFormArray.push(newItem);

    }

  }

  optionSelectedProducto( producto: Producto){

    const detalleTable = this.mapDetalleFrontToOptionTable( producto )

    this.agregarDetalleToArray( detalleTable )

    this.pageFormControlSearchTableGenericaSimpleDrawerProductos.hideDrawer();

  }

  async onUpdateDetalles(){

    if( !this.compra() ){
      this.toastService.showToast("Primero debes guardar la compra para poder actualizar sus detalles.", EnumEstatusToast.WARNING)
      return
    }

    this.detallesFormArray.markAllAsTouched()

    if( this.detallesFormArray.invalid){
      this.toastService.showToast("Por favor, corrige los errores en los detalles antes de guardar.", EnumEstatusToast.WARNING)
      return
    }

    const detallesParaEnviar = this.detallesFormArray.value.map(
      detalle => {

        return {
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
          costoUnitario: detalle.costoUnitario
        }

      }
    )

    try{

      const idCotizacionUpdated = await firstValueFrom(
        this.comprasService.updateCompraDetalles( this.compra()!.id, detallesParaEnviar )
      )

      this.toastService.showToast( "Detalles de la compra actualizados correctamente.", EnumEstatusToast.SUCCESS )

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

  }

  optionSelectedProveedor( option: Proveedor){

    this.optionSelectedProveedorValue.set( `${option.id} - ${ option.nombre }`)

    this.compraForm.patchValue({
      id_proveedor: option.id
    })

    this.pageFormControlSearchTableGenericaSimpleDrawerProveedor.hideDrawer();

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

  proveedoresRXResource = rxResource({
      params: () => ({page: 1, limit: 12, filtro: this.textoFiltrarProveedor() }),
      stream: ({params}) => {

        let filtro = params.filtro?.trim()

        if(!filtro){

          return this.proveedoresService.getProveedores({
            page: 1,
            limit: 24,
            filtro: ""
          })
        }

        if(filtro.length < 3){

          return of<ProveedoresResponse>({ page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, proveedores: [] })
        }

        return this.proveedoresService.getProveedores({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
  })

 }
