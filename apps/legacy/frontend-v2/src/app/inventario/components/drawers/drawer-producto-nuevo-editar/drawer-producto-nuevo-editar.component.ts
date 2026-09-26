import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { Producto } from '@inventario/interfaces/producto.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService } from '@inventario/services/productos.service';
import { SatService } from '@catalogos/services/sat.service';
import { ToastService } from '@shared/services/toast.service';
import { firstValueFrom, of } from 'rxjs';
import { SatProductoServicio } from '@facturas/interfaces/sat-producto-servicio.interface';
import { rxResource } from '@angular/core/rxjs-interop';
import { SatProductosServiciosResponse } from '@facturas/interfaces/sat-producto-servicio.response';
import { FormErrorLabelComponent } from "@shared/components/forms/form-error-label/form-error-label.component";
import { SatProductosServiciosTableComponent } from "@catalogos/components/tables/sat-productos-servicios-table/sat-productos-servicios-table.component";
import { SpinnerService } from '@shared/services/spinner.service';
import { PageFormControlSearchTableGenericaSimpleDrawerComponent } from '@shared/components/forms/page-form-control-search-table-generica-simple-drawer/page-form-control-search-table-generica-simple-drawer.component';

@Component({
  selector: 'app-drawer-producto-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent, PageFormControlSearchTableGenericaSimpleDrawerComponent, SatProductosServiciosTableComponent],
  templateUrl: './drawer-producto-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerProductoNuevoEditarComponent {

  producto = input.required<Producto | null>();

  guardadoCorrectoEmit = output<void>();

  //@ViewChild('pageFormControlSearchTableSimpleGenerica', {static: false})       pageFormControlSearchTableGenericaSimple!:       PageFormControlSearchTableGenericaSimpleComponent;
  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawer', {static: false}) pageFormControlSearchTableGenericaSimpleDrawer!: PageFormControlSearchTableGenericaSimpleDrawerComponent;

  fb = inject(FormBuilder);
  router = inject(Router);
  productosService = inject(ProductosService);
  satService = inject(SatService)
  toastService = inject(ToastService);

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  isOpen = false;

  textoFiltrarSatProductoServicio = signal('')
  private debounceTimer: any

  optionSelectedSatProductoServicioValue = signal<string | null>(null)

  productoForm = this.fb.group({
    descripcion: ['', [Validators.required] ],
    precioVenta: [null, [Validators.required] ],
    idSatProductoServicio: ['', [Validators.required] ],
    codigoBarras: ['', [] ],
    stockMinimo: [0, []],
    manejaInventario: [ false, []],
    permiteVentaSinStock: [ true, []],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngOnDestroy(): void {
    clearTimeout( this.debounceTimer )
  }

  setFormValue(){

    //this.productoForm.reset( this.producto() as any )

    if( this.producto() ){

      this.productoForm.patchValue( this.producto() as any );


      if( this.producto()?.satProductoServicio){
        this.productoForm.patchValue({
          idSatProductoServicio: this.producto()!.satProductoServicio.id
        });

        this.optionSelectedSatProductoServicioValue.set( `${ this.producto()!.satProductoServicio.clave  } - ${ this.producto()!.satProductoServicio.descripcion }`)

      }

    }
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  async onSubmit(){

    this.productoForm.markAllAsTouched();

    const isValid = this.productoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    const formValue = this.productoForm.value;

    const productoLike: Partial<Producto> = {
      ...(formValue as any),
    }

    if( !this.producto() ){

      try{

        const producto = await firstValueFrom(
          this.productosService.createProducto( productoLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente el nuevo producto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const producto = await firstValueFrom(
          this.productosService.updateProducto( this.producto()!.id, productoLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente el producto");

      }catch(error: any){
        this.toastService.showToastErrors(error)

      }

    }
  }

  filtrarSatProductoServicio(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.satProductoServicioRXResource.hasValue() ){

          if( this.satProductoServicioRXResource.value.length ){

            this.satProductoServicioRXResource.set({page: 1, totalItems: 0, satProductosServicios: [], limit: 0, totalPages: 0, hasNextPage: false});

          }

          return

        }

        return;
      }

      this.textoFiltrarSatProductoServicio.set( event )
    }, 300)
  }

  optionSelectedSatProductoServicio( option: SatProductoServicio){

    this.optionSelectedSatProductoServicioValue.set( `${option.clave} - ${ option.descripcion }`)

    this.productoForm.patchValue({
      idSatProductoServicio: option.id
    })

    //this.pageFormControlSearchTableGenericaSimple.hideDropdown();
    this.pageFormControlSearchTableGenericaSimpleDrawer.hideDrawer();

  }

  satProductoServicioRXResource = rxResource({
    params: () => ({page: 1, limit: 12, filtro: this.textoFiltrarSatProductoServicio() }),
    stream: ({params}) => {

      let filtro = params.filtro?.trim()

      if(!filtro){

        return this.satService.getSatProductosServicios({
          page: 1,
          limit: 24,
          filtro: ""
        }, "producto")
      }

      if(filtro.length < 3){

        return of<SatProductosServiciosResponse>({ page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, satProductosServicios: [] })

      }

      return this.satService.getSatProductosServicios({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      }, "producto")

    }
  })

}
