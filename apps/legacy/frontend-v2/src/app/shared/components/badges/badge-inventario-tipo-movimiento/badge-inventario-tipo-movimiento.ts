import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EnumInventarioTipoMovimiento } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-badge-inventario-tipo-movimiento',
  imports: [CommonModule],
  templateUrl: './badge-inventario-tipo-movimiento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeInventarioTipoMovimientoComponent{

  inventarioTipoMovimiento = input.required<EnumInventarioTipoMovimiento>();

  get EnumInventarioTipoMovimiento() {
    return EnumInventarioTipoMovimiento;
  }

}
