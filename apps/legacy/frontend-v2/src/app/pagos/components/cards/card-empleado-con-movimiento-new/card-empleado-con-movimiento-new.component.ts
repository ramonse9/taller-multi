import { NominaPeriodoTotal } from '../../../interfaces/periodos-movimientos-totales-response.interface';
import { Component, computed, EventEmitter, inject, input, Output, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { EmpleadoConMovimiento } from '../../../interfaces/periodo-movimientos-response.interface';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ToastService } from '@shared/services/toast.service';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { NominaService } from '../../../services/nomina.service';

@Component({
  selector: 'app-card-empleado-con-movimiento-new',
  templateUrl: './card-empleado-con-movimiento-new.component.html',
  imports: [CommonModule, NgIcon, ReactiveFormsModule],
  animations: [
    trigger('formularioAnim',[
      state('hidden', style({opacity: 0, height: '0px', overflow: 'hidden'})),
      state('visible', style({opacity: 1, height: '*'})),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class CardEmpleadoConMovimientoNewComponent {

  empleado = input.required<EmpleadoConMovimiento>();
  periodo = input.required<NominaPeriodoTotal>();

  toastService = inject(ToastService);
  authService = inject(AuthService);
  nominaService = inject(NominaService)

  onAgregarConcepto = output<{
    movimientoId: string,
    detalle: {
      concepto: string,
      monto: number,
      tipo: string
    }
  }>();

  @Output() recargarPeriodoMovimientosEmit = new EventEmitter<number>()

  onActualizarMovimiento = output<EmpleadoConMovimiento>();

  // Estado del formulario
  mostrarFormulario = false;
  conceptoForm: FormGroup;

  pagado = computed( () => {
    return !!this.empleado().movimiento
  })

  totalPagado = computed( () => {
    return this.empleado().movimiento ? Number( this.empleado().movimiento?.totalNeto ) : 0;
  })

  constructor(private fb: FormBuilder) {
    this.conceptoForm = this.fb.group({
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['PERCEPCION', Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.conceptoForm.reset({ tipo: 'PERCEPCION' });
    }
  }

  async pagar() {

    if( this.pagado() ){
      this.toastService.showToast("Este Empleado ya recibió su paga este periodo", EnumEstatusToast.WARNING);
      return;
    }

    const fechaActual = FormUtils.fechaParseISOTOUtc( new Date(), this.authService.user()!.zonaHoraria!.clave );

    const nuevoMovimiento = {
      salarioBase: this.empleado().salarioBase.toString(),
      totalPercepciones: "0",
      totalDeducciones: "0",
      totalNeto: this.empleado().salarioBase.toString(),
      fecha: fechaActual,
      id_empleado: this.empleado().id,
      id_periodo: this.periodo().id
    }

    try{

      const movimientoBD = await firstValueFrom(
        this.nominaService.createNominaMovimiento( nuevoMovimiento )
      )

      this.toastService.showToast("Se guardó correctamente el movimiento")

      this.recargarPeriodoMovimientosEmit.emit(this.periodo().id)

    }catch(error: any){
      this.toastService.showToastErrors(error);
    }

  }

  onSubmit(): void {
    if (this.conceptoForm.valid) {
      this.onAgregarConcepto.emit({
        movimientoId: this.empleado().id,
        detalle: {
          concepto: this.conceptoForm.value.concepto,
          monto: this.conceptoForm.value.monto,
          tipo: this.conceptoForm.value.tipo
        }
      });

      // Resetear formulario y cerrarlo
      this.conceptoForm.reset({ tipo: 'PERCEPCION' });
      this.mostrarFormulario = false;
    }
  }

  // Métodos auxiliares para determinar el tipo de detalle
  esPercepcion(detalle: any): boolean {
    return detalle.tipo === 'PERCEPCION';
  }

  esDeduccion(detalle: any): boolean {
    return detalle.tipo === 'DEDUCCION';
  }
}
