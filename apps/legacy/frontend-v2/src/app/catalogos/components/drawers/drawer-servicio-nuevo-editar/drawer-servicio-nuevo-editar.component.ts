import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { SatService } from '@catalogos/services/sat.service';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { SatProductoServicio } from '@facturas/interfaces/sat-producto-servicio.interface';
import { SatProductosServiciosResponse } from '@facturas/interfaces/sat-producto-servicio.response';
import { SatProductosServiciosTableComponent } from '@catalogos/components/tables/sat-productos-servicios-table/sat-productos-servicios-table.component';
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { ServiciosService } from '@catalogos/services/servicios.service';
import { PageFormControlSearchTableGenericaSimpleDrawerComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple-drawer/page-form-control-search-table-generica-simple-drawer.component";
import { SpinnerService } from '@shared/services/spinner.service';

@Component({
  selector: 'app-drawer-servicio-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent, SatProductosServiciosTableComponent, PageFormControlSearchTableGenericaSimpleDrawerComponent],
  templateUrl: './drawer-servicio-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerServicioNuevoEditarComponent implements OnInit {

  servicio = input.required<Servicio | null>()

  guardadoCorrectoEmit = output<void>();

  //@ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;
  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawer', {static: false}) pageFormControlSearchTableGenericaSimpleDrawer!: PageFormControlSearchTableGenericaSimpleDrawerComponent;

  fb = inject(FormBuilder);
  router = inject(Router);
  serviciosService = inject(ServiciosService);
  satService = inject(SatService)
  toastService = inject(ToastService);

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  textoFiltrarSatProductoServicio = signal('')
  private debounceTimer: any

  optionSelectedSatProductoServicioValue = signal<string | null>(null)

  servicioForm = this.fb.group({
    descripcion: ['', [Validators.required] ],
    precioVenta: [null, [Validators.required, Validators.min(1)] ],
    idSatProductoServicio: ['', [Validators.required] ],
    activo: [ true, []],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngOnDestroy(): void {
    clearTimeout( this.debounceTimer )
  }

  setFormValue(){

    this.servicioForm.reset( this.servicio() as any )

    if( this.servicio() ){

      this.servicioForm.patchValue({
        idSatProductoServicio: this.servicio()!.satProductoServicio.id
      })

      this.optionSelectedSatProductoServicioValue.set( `${ this.servicio()!.satProductoServicio.clave  } - ${ this.servicio()!.satProductoServicio.descripcion }`)

    }
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  async onSubmit(){

    this.servicioForm.markAllAsTouched();

    const isValid = this.servicioForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    const formValue = this.servicioForm.value;

    const servicioLike: Partial<Servicio> = {
      ...(formValue as any),
    }

    if( !this.servicio() ){

      try{

        const productoServicio = await firstValueFrom(
          this.serviciosService.createServicio( servicioLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se guardó correctamente el nuevo servicio");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const servicio = await firstValueFrom(
          this.serviciosService.updateServicio( this.servicio()!.id, servicioLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se actualizó correctamente el servicio");

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

    this.servicioForm.patchValue({
      idSatProductoServicio: option.id
    })

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
        },"servicio")
      }

      if(filtro.length < 3){

        return of<SatProductosServiciosResponse>({ page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, satProductosServicios: [] })

      }

      return this.satService.getSatProductosServicios({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      }, "servicio")

    }
  })
}
