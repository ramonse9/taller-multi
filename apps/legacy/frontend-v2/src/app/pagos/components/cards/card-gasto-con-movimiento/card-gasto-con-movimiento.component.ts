import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { GastoConMovimiento } from '@pagos/interfaces/gasto-concepto-con-gasto.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';
import { format, parseISO } from 'date-fns';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EnumEntidad, EnumTipoPagoGasto } from '@shared/enums/general-estatus.enum';
import { GastoMovimientoCreate } from '@pagos/interfaces/gasto-movimiento-create.interface';
import { firstValueFrom } from 'rxjs';
import { GastosMovimientosService } from '@pagos/services/gastos-movimientos.service';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'app-card-gasto-con-movimiento',
  imports: [CommonModule, NgIcon, TextPreviewComponent, ReactiveFormsModule ],
  templateUrl: './card-gasto-con-movimiento.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class CardGastoConMovimientoComponent {

  gastoConMovimiento = input.required<GastoConMovimiento>()
  mesSeleccionado = input.required<number>(); // 1-12
  anioSeleccionado = input.required<number>();

  seleccionado = input<boolean>(false);

  gastoConceptoConGastoLinked = linkedSignal( () => this.gastoConMovimiento() )

  guardadoCorrectoEmit = output<void>()

  agregarGasto = output<{ fecha: Date; monto: number }>();

  gastosMovimientosService = inject( GastosMovimientosService )
  authService = inject(AuthService)
  toastService = inject(ToastService)

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

  get EnumEntidad(){
    return EnumEntidad;
  }

  get totalGastado(){
    return this.gastoConMovimiento().gastosMovimientos?.reduce((sum, mov) => sum + Number(mov.monto), 0) || 0;
  }

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

  async onSubmit() {
    if (this.gastoForm.valid) {

      const nuevaFecha = FormUtils.fechaParseISOTOUtc( parseISO(this.gastoForm.value.fecha!), this.authService.user()!.zonaHoraria!.clave )

      //this.agregarGasto.emit({
      //  fecha: parseISO( nuevaFecha ),
      //  monto: Number( this.gastoForm.value.monto )
      //});

      try{

        const gastoMovimientoCreate: Partial<GastoMovimientoCreate> = {
          fecha:    FormUtils.fechaToUtcFromLocal( new Date( nuevaFecha ), this.authService.user()!.zonaHoraria!.clave  ),
          monto:    this.gastoForm.value.monto?.toString(),
          id_gasto: this.gastoConMovimiento().id,
          tipoPago: EnumTipoPagoGasto.CONTADO,
        }

        const gasto = await firstValueFrom(
          this.gastosMovimientosService.createGastoMovimiento( gastoMovimientoCreate)
        )

        this.guardadoCorrectoEmit.emit()
                              // this.recargarGastosConceptosConGastosEmit.emit();

        this.toastService.showToast("Se guardó correctamente el nuevo Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

      this.mostrarFormulario = false;
      this.gastoForm.reset({ fecha: this.getFechaActual() });
    }
  }

  /*
    async onAgregarGasto(data: { fecha: Date; monto: number }, gastoConceptoId: string) {

      const gastoMovimientoCreate: Partial<GastoMovimientoCreate> = {
        fecha:    FormUtils.fechaToUtcFromLocal( new Date( data.fecha ), this.authService.user()!.zonaHoraria!.clave  ),
        monto:    data.monto.toString(),
        id_gasto: gastoConceptoId,
        tipoPago: EnumTipoPagoGasto.CONTADO,
      }

      try{

        const gasto = await firstValueFrom(
          this.gastosMovimientosService.createGastoMovimiento( gastoMovimientoCreate)
        )

                      // this.recargarGastosConceptosConGastosEmit.emit();

        this.toastService.showToast("Se guardó correctamente el nuevo Gasto");

      }catch(error: any){
        this.toastService.showToastErrors(error)
      }

    }*/

}
