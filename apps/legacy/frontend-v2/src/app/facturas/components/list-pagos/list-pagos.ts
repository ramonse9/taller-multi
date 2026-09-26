import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pago } from '@facturas/interfaces/pago.interface';
import { CommonModule } from '@angular/common';
import { EnumEstatusCFDI } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-list-pagos',
  imports: [CommonModule, RouterLink],
  templateUrl: './list-pagos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPagos {

  pagos = input.required<Pago[]>();

  get EnumEstatusCFDI(){
    return EnumEstatusCFDI
  }


}
