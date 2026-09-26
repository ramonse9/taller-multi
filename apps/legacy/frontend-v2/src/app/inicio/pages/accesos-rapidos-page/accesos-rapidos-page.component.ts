import {ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardsAccesosRapidosComponent } from '@inicio/components/cards/cards-accesos-rapidos/cards-accesos-rapidos.component';
import { EnumColor, EnumRole } from '@shared/enums/general-estatus.enum';
import { AccesoRapidoItem } from '../../../shared/interfaces/acceso-rapido-item.interface';
import { hasRoleOrHigher } from '@shared/helpers/has-role-or-higher.helper';
import { AuthService } from '@auth/services/auth.service';
import { accesosRapidos } from '@shared/constants/acceso-rapido';

@Component({
  selector: 'app-accesos-rapidos-page',
  imports: [ CardsAccesosRapidosComponent ],
  templateUrl: './accesos-rapidos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesosRapidosPageComponent {

  authService = inject(AuthService)

  accesosFiltrado = computed( () => {
    return this.filtrarAccesosRapidos( accesosRapidos, this.authService.role()! )
  })

  filtrarAccesosRapidos(
    accesos: AccesoRapidoItem[],
    userRole: EnumRole
  ): AccesoRapidoItem[] {

    return accesos
      .filter(item => hasRoleOrHigher(userRole, item.minRole))
  }

}

export default AccesosRapidosPageComponent;
