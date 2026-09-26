import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageButtonBackComponent } from '../page-button-back/page-button-back.component';
import { PageTitleDetailComponent } from '../page-title-detail/page-title-detail.component';
import { PageButtonSubmitComponent } from '../page-button-submit/page-button-submit.component';

@Component({
  selector: 'app-page-form-header',
  imports: [ PageButtonBackComponent, PageTitleDetailComponent, PageButtonSubmitComponent ],
  templateUrl: './page-form-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFormHeaderComponent {

  titleNew      = input.required<string>();
  titleUpdate   = input.required<string>();
  id            = input.required<string>();
  detail        = input.required<string>();
  subdetail     = input<string>('');
  guardar       = input<string>('Guardar');
  emitir        = input<boolean>(false);
  subtitle      = input<boolean>(true);
}
