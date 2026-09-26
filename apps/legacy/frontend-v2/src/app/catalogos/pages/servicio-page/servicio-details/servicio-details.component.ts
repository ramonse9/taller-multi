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
import { Servicio } from '@catalogos/interfaces/servicio.interface';
import { ServiciosService } from '@catalogos/services/servicios.service';

@Component({
  selector: 'app-servicio-details',
  imports: [CommonModule, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent, SatProductosServiciosTableComponent, PageFormControlSearchTableGenericaSimpleComponent],
  templateUrl: './servicio-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicioDetailsComponent implements OnInit {

  servicio = input.required<Servicio | null>()

  @ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;

  fb = inject(FormBuilder);
  router = inject(Router);
  serviciosService = inject(ServiciosService);
  satService = inject(SatService)
  toastService = inject(ToastService);

  textoFiltrarSatProductoServicio = signal('')
  private debounceTimer: any

  optionSelectedSatProductoServicioValue = signal<string | null>(null)

  servicioForm = this.fb.group({
    descripcion: ['', [Validators.required] ],
    precioVenta: [null, [Validators.required, Validators.min(1)] ],
    idSatProductoServicio: ['', [Validators.required] ]
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

        this.router.navigate(['/catalogos/servicios']);

        this.toastService.showToast("Se guardó correctamente el nuevo servicio");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const servicio = await firstValueFrom(
          this.serviciosService.updateServicio( this.servicio()!.id, servicioLike )
        )

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
