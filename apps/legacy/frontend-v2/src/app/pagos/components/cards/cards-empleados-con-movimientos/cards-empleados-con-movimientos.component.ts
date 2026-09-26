import { NominaPeriodoTotal } from '../../../interfaces/periodos-movimientos-totales-response.interface';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, Output } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@auth/services/auth.service';
import { NominaService } from '../../../services/nomina.service';
import { EmpleadoConMovimiento } from '../../../interfaces/periodo-movimientos-response.interface';
import { CardEmpleadoConMovimientoNewComponent } from '../card-empleado-con-movimiento-new/card-empleado-con-movimiento-new.component';

@Component({
  selector: 'app-cards-empleados-con-movimientos',
  imports: [BadgeMessageComponent, CardEmpleadoConMovimientoNewComponent],
  templateUrl: './cards-empleados-con-movimientos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsEmpleadosConMovimientosComponent {

  empleadosConMovimientos = input.required<EmpleadoConMovimiento[]>();
  periodo = input.required<NominaPeriodoTotal>();
  empleadosConMovimientosListado = linkedSignal( () => this.empleadosConMovimientos() )

  @Output() recargarPeriodoMovimientosEmit: EventEmitter<number> = new EventEmitter<number>();

  nominaService = inject(NominaService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  recargarPeriodoMovimientos( id_periodo: number ){
    this.recargarPeriodoMovimientosEmit.emit( id_periodo)
  }

  /*
  async onAgregarGasto(data: { fecha: Date; monto: number }, gastoConceptoId: string) {

    const gastoCreate: Partial<GastoCreate> = {
      fecha:    FormUtils.fechaToUtcFromLocal( new Date( data.fecha ), this.authService.user()!.zonaHoraria!.clave  ),
      monto:    data.monto.toString(),
      id_gasto_concepto: gastoConceptoId,
      tipoPago: EnumTipoPagoGasto.CONTADO,
    }

    try{

      const gasto = await firstValueFrom(
        this.nominaService.createGasto( gastoCreate)
      )

      this.recargarGastosConceptosConGastosEmit.emit();

      this.toastService.showToast("Se guardó correctamente el nuevo Gasto");

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

  }
  */

 }
