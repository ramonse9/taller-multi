import { Router } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { PageFormControlSearchTableGenericaComponent } from '@shared/components/forms/page-form-control-search-table-generica/page-form-control-search-table-generica.component';
import { SatService } from '@catalogos/services/sat.service';
import { EnumEstatusToast, EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';
import { SpinnerService } from '@shared/services/spinner.service';
import { Gasto } from '@pagos/interfaces/gasto.interface';
import { GastosService } from '@catalogos/services/gastos.service';
import { GastoMovimiento } from '@pagos/interfaces/gasto-movimiento.interface';
import { GastoResponse } from '@pagos/interfaces/gasto.response';

@Component({
  selector: 'app-drawer-gasto-movimiento-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent ],
  templateUrl: './drawer-gasto-movimiento-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastoDetailsComponent implements AfterViewInit {

  gastoMovimiento = input.required<GastoMovimiento>()

  guardadoCorrectoEmit = output<void>();

  @ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;
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

  textoFiltrarGastoConcepto = signal('')
  private debounceTimer: any

  optionSelectedGastoValue = signal<string | null>(null)

  gastoMovimientoForm = this.fb.group({
    monto: [null, [Validators.required, Validators.min(1)] ],
    fecha: [ '', [Validators.required]],
    idGasto: ['', [Validators.required] ],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngAfterViewInit(){

    this.flatpickrFechaInstance = flatpickr(this.dateInputFecha.nativeElement, {
      dateFormat: 'd-m-Y H:i',
      locale: Spanish,
      enableTime: true,
      defaultDate: new Date(),
      onChange: (selectedDates) => {
        const fecha = selectedDates[0];
        this.gastoMovimientoForm.controls.fecha.setValue(fecha.toString());
      }
    });

  }

  ngOnDestroy(): void {
    clearTimeout( this.debounceTimer )
  }

  setFormValue(){

    this.gastoMovimientoForm.reset( this.gastoMovimiento() as any )

    const fechaDate = this.getFechaInicial();

    this.flatpickrFechaInstance?.setDate( fechaDate, false);

    this.gastoMovimientoForm.controls.fecha.setValue( fechaDate.toString() );

    if( this.gastoMovimiento().id !== 'new'){

      this.gastoMovimientoForm.patchValue({
        idGasto: this.gastoMovimiento().gasto.id
      })

      this.optionSelectedGastoValue.set( `${ this.gastoMovimiento().gasto.id  } - ${ this.gastoMovimiento().gasto.nombre }`)

    }
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }

  private getFechaInicial(){

    if( !this.gastoMovimiento().fecha ){
      return new Date();
    }

    return new Date( this.gastoMovimiento().fecha! )
  }

  async onSubmit(){

    this.gastoMovimientoForm.markAllAsTouched();

    const isValid = this.gastoMovimientoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    //const formValue = this.gastoForm.value;

    const fecha = this.gastoMovimientoForm.controls.fecha.value;

    const gastoLike: Partial<Gasto> = {
      ...(this.gastoMovimientoForm.value as any),
      fecha:             FormUtils.fechaToUtcFromLocal( new Date( fecha! ), this.authService.user()!.zonaHoraria!.clave ),
    }

    if( this.gastoMovimiento().id == 'new'  ){

      try{

        const gasto = await firstValueFrom(
          this.gastosService.createGasto( gastoLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se guardó correctamente el nuevo Movimiento del Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const gasto = await firstValueFrom(
          this.gastosService.updateGasto( this.gastoMovimiento().id, gastoLike )
        )

        this.guardadoCorrectoEmit.emit();

        this.toastService.showToast("Se actualizó correctamente el Movimiento del Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)

      }

    }
  }

  filtrarGastoConcepto(event: string){

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout( () => {

      if( event.length == 1 || event.length == 2 ){

        if( this.gastoRXResource.hasValue() ){

          if( this.gastoRXResource.value.length ){

            this.gastoRXResource.set({page: 1, totalItems: 0, gastos: [], limit: 0, totalPages: 0, hasNextPage: false});

          }

          return

        }

        return;
      }

      this.textoFiltrarGastoConcepto.set( event )
    }, 300)
  }

  optionSelectedGasto( option: Gasto){

    this.optionSelectedGastoValue.set( `${option.id} - ${ option.nombre }`)

    this.gastoMovimientoForm.patchValue({
      idGasto: option.id
    })

    this.pageFormControlSearchTableGenerica.hideDropdown();

  }

  gastoRXResource = rxResource({
    params: () => ({page: 1, limit: 12, filtro: this.textoFiltrarGastoConcepto() }),
    stream: ({params}) => {

      let filtro = params.filtro?.trim()

      if(!filtro){

        return this.gastosService.getGastos({
          page: 1,
          limit: 24,
          filtro: ""
        })
      }

      if(filtro.length < 3){

        return of<GastoResponse>({ page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNextPage: false, gastos: [] })

      }

      return this.gastosService.getGastos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })
}
