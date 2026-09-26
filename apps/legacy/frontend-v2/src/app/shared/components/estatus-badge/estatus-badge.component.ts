import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estatus } from '@shared/interfaces/estatus.interface';
import { EstatusService } from '@shared/services/estatus.service';
import { EnumCategoria } from '@shared/enums/general-estatus.enum';


@Component({
  selector: 'app-estatus-badge',
  imports: [CommonModule],
  templateUrl: './estatus-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstatusBadgeComponent {

  clave = input.required<string>()
  categoria = input.required<EnumCategoria>()

  estatusService = inject(EstatusService)

  get estatus():Estatus | null{
    return this.estatusService.getEstatusByCategoriaAndClave( this.categoria(), this.clave() )
  }

}
