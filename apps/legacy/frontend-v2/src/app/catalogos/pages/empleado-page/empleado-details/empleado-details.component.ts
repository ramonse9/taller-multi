import { NominaService } from '../../../../pagos/services/nomina.service';
import { Router } from '@angular/router';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { PageFormHeaderComponent } from '@shared/components/forms/page-form-header/page-form-header.component';
import { PageFormBodyComponent } from '@shared/components/forms/page-form-body/page-form-body.component';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { EnumPaginasTitulo } from '@shared/enums/general-estatus.enum';
import { AuthService } from '@auth/services/auth.service';
import { Empleado } from '@pagos/interfaces/empleado.interface';

@Component({
  selector: 'app-empleado-details',
  imports: [CommonModule, ReactiveFormsModule, PageFormHeaderComponent, PageFormBodyComponent, FormErrorLabelComponent],
  templateUrl: './empleado-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoDetailsComponent implements AfterViewInit {

  //gastoConcepto = input.required<GastoConcepto>()
  empleado = input.required<Empleado | null>()

  //@ViewChild('pageFormControlSearchTableGenerica', {static: false}) pageFormControlSearchTableGenerica!: PageFormControlSearchTableGenericaComponent;
  //@ViewChild('dateInputFecha', { static: false }) dateInputFecha!: ElementRef;

  //flatpickrFechaInstance!: flatpickr.Instance;

  fb = inject(FormBuilder);
  router = inject(Router);
  //gastosConceptosService = inject(GastosConceptosService);
  nominaService = inject(NominaService);
  //satService = inject(SatService)
  toastService = inject(ToastService);
  authService = inject(AuthService);

  textoFiltrarGastoCategoria = signal('')
  private debounceTimer: any

  //optionSelectedGastoCategoriaValue = signal<string | null>(null)

  empleadoForm = this.fb.group({
    nombre: ['', [Validators.required ] ],
    salarioBase: ['', [Validators.required ] ],
    activo: [ true, [Validators.required]],
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

    this.empleadoForm.reset( this.empleado() as any )

    //const fechaDate = this.getFechaInicial();

    //this.flatpickrFechaInstance?.setDate( fechaDate, false);

    //this.gastoForm.controls.fecha.setValue( fechaDate.toString() );

    //if( this.nominaEmpleado().id !== 'new'){

      //this.nominaEmpleadoForm.patchValue({
      //  id_gasto_categoria: this.nominaEmpleado().gastoCategoria.id
      //})

      //this.optionSelectedGastoCategoriaValue.set( `${ this.nominaEmpleado().gastoCategoria.id  } - ${ this.nominaEmpleado().gastoCategoria.nombre }`)

    //}
  }

  get EnumPaginasTitulo(){
    return EnumPaginasTitulo;
  }



  async onSubmit(){
    /*

    this.nominaEmpleadoForm.markAllAsTouched();

    const isValid = this.nominaEmpleadoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    const nominaEmpleadoLike: Partial<NominaEmpleado> = {
      ...(this.nominaEmpleadoForm.value as CreateNominaEmpleado),
    }



    if( !this.nominaEmpleado() ){

      try{

        const nominaEmpleado = await firstValueFrom(
          this.nominaService.createNominaEmpleado( nominaEmpleadoLike )
        )

        this.router.navigate(['/catalogo/empleados']);

        this.toastService.showToast("Se guardó correctamente el nuevo Empleado");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const gasto = await firstValueFrom(
          this.nominaService.updateNominaEmpleado( this.nominaEmpleado()!.id, nominaEmpleadoLike )
        )

        this.toastService.showToast("Se actualizó correctamente el Empleado");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }
    */
  }

}
