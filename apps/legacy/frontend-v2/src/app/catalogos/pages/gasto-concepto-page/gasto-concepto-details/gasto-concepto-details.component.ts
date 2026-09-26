//import { GastosConceptosService } from '../../../services/gastos.service';
import { Router } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { PageFormControlSearchTableGenericaComponent } from '@shared/components/forms/page-form-control-search-table-generica/page-form-control-search-table-generica.component';
import { SatService } from '@catalogos/services/sat.service';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
//import { GastoConcepto } from '@pagos/interfaces/gasto.interface';
import flatpickr from 'flatpickr';
import { AuthService } from '@auth/services/auth.service';
import { GastoCategoriaResponse } from '@pagos/interfaces/gasto-categoria.response';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { GastosService } from '@catalogos/services/gastos.service';

@Component({
  selector: 'app-gasto-concepto-details',
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './gasto-concepto-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastoConceptoDetailsComponent implements AfterViewInit {

  gasto = input.required<Gasto | null>()

  @ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;
  @ViewChild('dateInputFecha', { static: false }) dateInputFecha!: ElementRef;

  flatpickrFechaInstance!: flatpickr.Instance;

  fb = inject(FormBuilder);
  router = inject(Router);
  gastosService = inject(GastosService);
  satService = inject(SatService)
  toastService = inject(ToastService);
  authService = inject(AuthService);

  textoFiltrarGastoCategoria = signal('')
  private debounceTimer: any

  optionSelectedGastoCategoriaValue = signal<string | null>(null)

  gastoForm = this.fb.group({
    nombre: [null, [Validators.required ] ],
    recurrente: [ true, [Validators.required]],
    activo: [ true, [Validators.required]],
    id_gasto_categoria: ['', [Validators.required] ],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngAfterViewInit(){

    /*this.flatpickrFechaInstance = flatpickr(this.dateInputFecha.nativeElement, {
      dateFormat: 'd-m-Y H:i',
      locale: Spanish,
      enableTime: true,
      defaultDate: new Date(),
      onChange: (selectedDates) => {
        const fecha = selectedDates[0];
        this.gastoForm.controls.fecha.setValue(fecha.toString());
      }
    });*/

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

    //const fecha = this.gastoConceptoForm.controls.fecha.value;

    const gastoLike: Partial<Gasto> = {
      ...(this.gastoForm.value as any),
      //fecha:             FormUtils.fechaToUtcFromLocal( new Date( fecha! ), this.authService.user()!.zonaHoraria!.clave ),
    }

    if( !this.gasto() ){

      try{

        const gastoConcepto = await firstValueFrom(
          this.gastosService.createGasto( gastoLike )
        )

        //this.router.navigate(['/catalogos/gastosconceptos']);


        this.toastService.showToast("Se guardó correctamente el nuevo Concepto del Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const gasto = await firstValueFrom(
          this.gastosService.updateGasto( this.gasto()!.id, gastoLike )
        )

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

    this.pageFormControlSearchTableGenerica.hideDropdown();

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
