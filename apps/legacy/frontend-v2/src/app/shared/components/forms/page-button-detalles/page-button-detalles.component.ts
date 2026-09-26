import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { EnumLinks } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-page-button-detalles',
  imports: [RouterLink, NgIcon],
  templateUrl: './page-button-detalles.component.html',
})
export class PageButtonDetallesComponent {
  
  link = input.required<EnumLinks>();
  id = input.required<string>();
  detalle = input.required<string>();

}
