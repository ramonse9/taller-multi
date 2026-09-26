import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-badge-simple',
  imports: [CommonModule],
  templateUrl: './badge-simple.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeSimple {

  description = input.required<string>()
  color = input.required<EnumBadgeSimpleColor>()

}
