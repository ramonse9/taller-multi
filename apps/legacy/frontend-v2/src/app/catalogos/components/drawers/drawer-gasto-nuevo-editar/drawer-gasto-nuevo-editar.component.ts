import { GastosService } from '../../../services/gastos.service';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { SatService } from '@catalogos/services/sat.service';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import flatpickr from 'flatpickr';
import { AuthService } from '@auth/services/auth.service';
import { GastoCategoriaResponse } from '@pagos/interfaces/gasto-categoria.response';
import { GastosCategoriasTableComponent } from "@catalogos/components/tables/gastos-categorias-table/gastos-categorias-table.component";
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { SpinnerService } from '@shared/services/spinner.service';
import { PageFormControlSearchTableGenericaSimpleDrawerComponent } from "@shared/components/forms/page-form-control-search-table-generica-simple-drawer/page-form-control-search-table-generica-simple-drawer.component";

@Component({
  selector: 'app-drawer-gasto-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent, GastosCategoriasTableComponent, PageFormControlSearchTableGenericaSimpleDrawerComponent],
  templateUrl: './drawer-gasto-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerGastoNuevoEditarComponent {

  gasto = input.required<Gasto | null>()

  guardadoCorrectoEmit = output<void>();

  @ViewChild('pageFormControlSearchTableGenericaSimpleDrawer', {static: false}) pageFormControlSearchTableGenericaSimpleDrawer!: PageFormControlSearchTableGenericaSimpleDrawerComponent;
  @ViewChild('dateInputFecha', { static: false }) dateInputFecha!: ElementRef;

  flatpickrFechaInstance!: flatpickr.Instance;

  fb = inject(FormBuilder);
  router = inject(Router);
  gastosService = inject(GastosService);
  satService = inject(SatService)
  toastService = inject(ToastService);
  authService = inject(AuthService);
  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  textoFiltrarGastoCategoria = signal('')
  private debounceTimer: any

  optionSelectedGastoCategoriaValue = signal<string | null>(null)

  gastoForm = this.fb.group({
    nombre: [null, [Validators.required ] ],
    id_gasto_categoria: ['', [Validators.required] ],
    recurrente: [ true, []],
    activo: [ true, []],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngOnDestroy(): void {
    clearTimeout( this.debounceTimer )
  }

  setFormValue(){

    this.gastoForm.reset( this.gasto() as any )

    //const fechaDate = this.getFechaInicial();

    //this.flatpickrFechaInstance?.setDate( fechaDate, false);

    //this.gastoForm.controls.fecha.setValue( fechaDate.toString() );

    if( this.gasto() ){

      this.gastoForm.patchValue({
        id_gasto_categoria: this.gasto()!.gastoCategoria.id
      })

      this.optionSelectedGastoCategoriaValue.set( `${ this.gasto()!.gastoCategoria.id  } - ${ this.gasto()!.gastoCategoria.nombre }`)

    }
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  /*private getFechaInicial(){

    if( !this.gasto().fecha ){
      return new Date();
    }

    return new Date( this.gasto().fecha! )
  }*/

  async onSubmit(){

    this.gastoForm.markAllAsTouched();

    const isValid = this.gastoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    //const formValue = this.gastoForm.value;

    const gastoLike: Partial<Gasto> = {
      ...(this.gastoForm.value as any),
      //fecha:             FormUtils.fechaToUtcFromLocal( new Date( fecha! ), this.authService.user()!.zonaHoraria!.clave ),
    }

    if( !this.gasto() ){

      try{

        const gasto = await firstValueFrom(
          this.gastosService.createGasto( gastoLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se guardó correctamente el nuevo Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const gasto = await firstValueFrom(
          this.gastosService.updateGasto( this.gasto()!.id, gastoLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se actualizó correctamente el Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)

      }

    }
  }

  filtrarGastoCategoria(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.gastoCategoriaRXResource.hasValue() ){

          if( this.gastoCategoriaRXResource.value.length ){

            this.gastoCategoriaRXResource.set({page: 1, totalItems: 0, gastosCategorias: [], limit: 0, totalPages: 0, hasNextPage: false});

          }

          return

        }

        return;
      }

      this.textoFiltrarGastoCategoria.set( event )
    }, 300)
  }

  //TODO
  //optionSelectedGastoCategoria( option: GastoCategoria){
  optionSelectedGastoCategoria( option: any){

    this.optionSelectedGastoCategoriaValue.set( `${option.id} - ${ option.nombre }`)

    this.gastoForm.patchValue({
      id_gasto_categoria: option.id
    })

    this.pageFormControlSearchTableGenericaSimpleDrawer.hideDrawer();
    //this.pageFormControlSearchTableGenerica.hideDropdown();

  }

  gastoCategoriaRXResource = rxResource({
    params: () => ({page: 1, limit: 12, filtro: this.textoFiltrarGastoCategoria() }),
    stream: ({params}) => {

      let filtro = params.filtro?.trim()

      if(!filtro){

        return this.gastosService.getGastosCategorias({
          page: 1,
          limit: 24,
          filtro: ""
        })
      }

      if(filtro.length < 3){

        return of<GastoCategoriaResponse>({ page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, gastosCategorias: [] })

      }

      return this.gastosService.getGastosCategorias({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })
}
