import { ChangeDetectionStrategy, Component, computed,  inject, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { EstatusIndicatorComponent } from "@shared/components/estatus-indicator/estatus-indicator.component";
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';
import { format, parseISO } from 'date-fns';
import { EmpleadoConMovimiento } from '@pagos/interfaces/periodo-movimientos-response.interface';

@Component({
  selector: 'app-card-empleado-con-movimientos',
  imports: [CommonModule, NgIcon, RouterLink, TextPreviewComponent, EstatusIndicatorComponent, EstatusBadgeComponent, ReactiveFormsModule],
  templateUrl: './card-empleado-con-movimientos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEmpleadoConMovimientoComponent {

  //gastoConceptoConGasto = input.required<GastoConceptoConGasto>()
  empleadoConMovimiento = input.required<EmpleadoConMovimiento>()
  mesSeleccionado = input.required<number>(); // 1-12
  anioSeleccionado = input.required<number>();

  //gastoConceptoConGastoLinked = linkedSignal( () => this.gastoConMovimientos() )
  empleadoConMovimientoLinked = linkedSignal( () => this.empleadoConMovimiento() )

  agregarGasto = output<{ fecha: Date; monto: number }>();

  authService = inject(AuthService)

  fb = inject(FormBuilder)

  gastoForm = this.fb.group({
    fecha: [ '', Validators.required],
    monto: ['', [Validators.required, Validators.min(1)]]
  });

  mostrarFormulario = false;

  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  mesNombre = computed( () => this.meses.find( m => m.valor === this.mesSeleccionado() )!.nombre )

  private getFechaActual(): string {
    const hoy = new Date();
    return format( hoy, "yyyy-MM-dd'T'HH:mm")
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (this.mostrarFormulario) {
      this.gastoForm.reset({ fecha: this.getFechaActual() });
    }
  }

  onSubmit(): void {
    if (this.gastoForm.valid) {

      const nuevaFecha = FormUtils.fechaParseISOTOUtc( parseISO(this.gastoForm.value.fecha!), this.authService.user()!.zonaHoraria!.clave )

      this.agregarGasto.emit({
        fecha: parseISO( nuevaFecha ),
        monto: Number( this.gastoForm.value.monto )
      });

      this.mostrarFormulario = false;
      this.gastoForm.reset({ fecha: this.getFechaActual() });
    }
  }

}
