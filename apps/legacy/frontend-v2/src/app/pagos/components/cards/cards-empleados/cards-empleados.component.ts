import { CardEmpleadoNewComponent } from '../card-empleado-new/card-empleado-new.component';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, Output } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@auth/services/auth.service';
import { NominaService } from '../../../services/nomina.service';
import { Empleado } from '@pagos/interfaces/empleado.interface';

@Component({
  selector: 'app-cards-empleados',
  imports: [BadgeMessageComponent, CardEmpleadoNewComponent],
  templateUrl: './cards-empleados.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsEmpleadosComponent {

  empleados = input.required<Empleado[]>();
  empleadosListado = linkedSignal( () => this.empleados() )

  nominaService = inject(NominaService);
  toastService = inject(ToastService);
  authService = inject(AuthService);

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

 }
