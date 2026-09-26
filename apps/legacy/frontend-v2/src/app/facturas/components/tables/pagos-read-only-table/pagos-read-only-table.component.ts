import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { FormUtils } from '../../../../shared/utils/form-utils';
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'app-pagos-read-only-table',
  imports: [CommonModule],
  templateUrl: './pagos-read-only-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagosReadOnlyTableComponent implements OnInit {

  pagos = input.required<any>()

  authService = inject(AuthService);

  ngOnInit(){
  }

  fechaToLocale( fecha: string ){

    return FormUtils.formatIsoStringToLocalDisplay(fecha, this.authService.user()?.zonaHoraria.clave)

  }

}
