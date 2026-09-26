import { EnumNominaMovimientoTipo } from '@shared/enums/general-estatus.enum';
import { NominaMovimientoDetalle } from '../../../interfaces/nomina-movimiento-detalle.interface';
import { NominaMovimiento } from '../../../interfaces/nomina-movimiento.interface';
import { Component, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-card-nomina-movimiento',
  templateUrl: './card-nomina-movimiento.component.html',
  imports: [CommonModule, NgIcon, ReactiveFormsModule]

})
export class CardNominaMovimientoComponent {
  // Input requerido
  nominaMovimiento = input.required<NominaMovimiento>();

  // Outputs para comunicar acciones
  onAgregarConcepto = output<{ movimientoId: string, detalle: Partial<NominaMovimientoDetalle> }>();
  onActualizarMovimiento = output<NominaMovimiento>();

  // Estado del formulario
  mostrarFormulario = false;
  conceptoForm: FormGroup;

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

  onSubmit(): void {
    if (this.conceptoForm.valid) {
      this.onAgregarConcepto.emit({
        movimientoId: this.nominaMovimiento().id,
        detalle: this.conceptoForm.value
      });

      // Opcional: resetear formulario y cerrarlo
      this.conceptoForm.reset({ tipo: 'PERCEPCION' });
      this.mostrarFormulario = false;
    }
  }

  // Método auxiliar para calcular si es percepción o deducción
  esPercepcion(tipo: EnumNominaMovimientoTipo): boolean {
    return tipo === EnumNominaMovimientoTipo.PERCEPCION;
  }
}
