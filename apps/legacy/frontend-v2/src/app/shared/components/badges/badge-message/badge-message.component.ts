import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EnumEstatusToast } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-badge-message',
  imports: [CommonModule],
  templateUrl: './badge-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeMessageComponent {

  //message = signal<string>('');
  message = input.required<string>();
  estatus = input<EnumEstatusToast>(EnumEstatusToast.WARNING)

  get EnumEstatusToast(){
    return EnumEstatusToast
  }

}
