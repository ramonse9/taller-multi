
import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, Output } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros, EnumTipoPagoGasto } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@shared/services/toast.service';
import { FormUtils } from '@shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';
import { GastoMovimientoCreate } from '@pagos/interfaces/gasto-movimiento-create.interface';
import { GastosMovimientosService } from '@pagos/services/gastos-movimientos.service';
import { GastoConMovimiento } from '@pagos/interfaces/gasto-concepto-con-gasto.interface';
import { CardGastoConMovimientoComponent } from '../card-gasto-con-movimiento/card-gasto-con-movimiento.component';

@Component({
  selector: 'app-cards-gastos-conceptos-con-gastos',
  imports: [BadgeMessageComponent, CardGastoConMovimientoComponent],
  templateUrl: './cards-gastos-conceptos-con-gastos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsGastosConceptosConGastosComponent {

  gastosConMovimientos = input.required<GastoConMovimiento[]>();
  mesSeleccionado = input.required<number>(); // 1-12
  anioSeleccionado = input.required<number>();

  gastosConMovimientosListado = linkedSignal( () => this.gastosConMovimientos() )

  @Output() recargarGastosConceptosConGastosEmit = new EventEmitter<void>();

  //gastosService = inject(GastosService);
  gastosMovimientosService = inject(GastosMovimientosService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

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

      this.recargarGastosConceptosConGastosEmit.emit();

      this.toastService.showToast("Se guardó correctamente el nuevo Gasto");

    }catch(error: any){
      this.toastService.showToastErrors(error)
    }

  }

 }
