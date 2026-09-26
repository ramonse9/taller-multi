import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { PageFormControlSearchTableGenericaComponent } from '@shared/components/forms/page-form-control-search-table-generica/page-form-control-search-table-generica.component';
import { SatService } from '@catalogos/services/sat.service';
import { PageFormControlSearchTableGenericaSimpleComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple/page-form-control-search-table-generica-simple.component";
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { SatProductoServicio } from '@facturas/interfaces/sat-producto-servicio.interface';
import { SatProductosServiciosResponse } from '@facturas/interfaces/sat-producto-servicio.response';
import { SatProductosServiciosTableComponent } from '@catalogos/components/tables/sat-productos-servicios-table/sat-productos-servicios-table.component';
import { ProductosService } from '@inventario/services/productos.service';
import { Producto } from '@inventario/interfaces/producto.interface';

@Component({
  selector: 'app-producto-details',
  imports: [CommonModule, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent, SatProductosServiciosTableComponent, PageFormControlSearchTableGenericaSimpleComponent],
  templateUrl: './producto-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetailsComponent implements OnInit {

  producto = input.required<Producto | null>()

  @ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;

  fb = inject(FormBuilder);
  router = inject(Router);
  productosService = inject(ProductosService);
  satService = inject(SatService)
  toastService = inject(ToastService);

  isOpen = false;

  textoFiltrarSatProductoServicio = signal('')
  private debounceTimer: any

  optionSelectedSatProductoServicioValue = signal<string | null>(null)

  productoForm = this.fb.group({
    descripcion: ['', [Validators.required] ],
    precioVenta: [null, [Validators.required] ],
    idSatProductoServicio: ['', [Validators.required] ],
    codigoBarras: ['', [] ],
    stockMinimo: [null, []],
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

        this.router.navigate(['/inventario/productos']);

        this.toastService.showToast("Se guardó correctamente el nuevo producto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const producto = await firstValueFrom(
          this.productosService.updateProducto( this.producto()!.id, productoLike )
        )

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

    this.pageFormControlSearchTableGenerica.hideDropdown();

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
