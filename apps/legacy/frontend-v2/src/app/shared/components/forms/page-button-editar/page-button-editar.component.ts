import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { EnumLinks } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-page-button-editar',
  imports: [ RouterLink, NgIcon ],
  templateUrl: './page-button-editar.component.html',
})
export class PageButtonEditarComponent {

  link = input.required<EnumLinks>();
  id = input.required<string>();

}
