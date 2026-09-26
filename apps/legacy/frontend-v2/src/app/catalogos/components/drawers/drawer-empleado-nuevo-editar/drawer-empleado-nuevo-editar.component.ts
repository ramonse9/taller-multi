import { Empleado } from '../../../../pagos/interfaces/empleado.interface';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastService } from '@shared/services/toast.service';
import { FormErrorLabelComponent } from '@shared/components/forms/form-error-label/form-error-label.component';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { AuthService } from '@auth/services/auth.service';
import { SpinnerService } from '@shared/services/spinner.service';
import { EmpleadosService } from '@pagos/services/empleados.service';
import { CreateEmpleado } from '@pagos/interfaces/create-empleado.interface';

@Component({
  selector: 'app-drawer-empleado-nuevo-editar',
  imports: [CommonModule, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './drawer-empleado-nuevo-editar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerEmpleadoNuevoEditarComponent {

  empleado = input.required<Empleado | null>()

  guardadoCorrectoEmit = output<void>()

  fb = inject(FormBuilder);
  router = inject(Router);

  empleadosService = inject(EmpleadosService);

  toastService = inject(ToastService);
  authService = inject(AuthService);

  spinnerService = inject(SpinnerService);

  isLoading = this.spinnerService.isLoading$

  textoFiltrarGastoCategoria = signal('')
  private debounceTimer: any

  empleadoForm = this.fb.group({
    nombre: ['', [Validators.required ] ],
    salarioBase: ['', [Validators.required ] ],
    activo: [ true, []],
  })

  ngOnInit(): void {
    this.setFormValue()
  }

  ngOnDestroy(): void {
    clearTimeout( this.debounceTimer )
  }

  setFormValue(){

    this.empleadoForm.reset( this.empleado() as any )

  }

  async onSubmit(){

    this.empleadoForm.markAllAsTouched();

    const isValid = this.empleadoForm.valid;

    if(!isValid){
      this.toastService.showToast("Debes capturar la información solicitada", EnumEstatusToast.WARNING);
      return
    }

    const empleadoLike: Partial<Empleado> = {
      ...(this.empleadoForm.value as CreateEmpleado),
    }

    if( !this.empleado() ){

      try{

        const empleado = await firstValueFrom(
          this.empleadosService.createEmpleado( empleadoLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se guardó correctamente el nuevo Empleado");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }else{

      try{

        const gasto = await firstValueFrom(
          this.empleadosService.updateEmpleado( this.empleado()!.id, empleadoLike )
        )

        this.guardadoCorrectoEmit.emit()

        this.toastService.showToast("Se actualizó correctamente el Empleado");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }
  }

}
