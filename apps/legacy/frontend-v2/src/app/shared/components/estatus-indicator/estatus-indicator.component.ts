import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstatusService } from '@shared/services/estatus.service';
import { EnumCategoria } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-estatus-indicator',
  imports: [CommonModule],
  templateUrl: './estatus-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstatusIndicatorComponent {

  categoria = input.required<EnumCategoria>();
  clave = input.required<string>();

  estatusService = inject(EstatusService)

  get classIndicator(){
    return this.estatusService.getEstatusByCategoriaAndClave( this.categoria(), this.clave() )?.classIndicator
  }

}
