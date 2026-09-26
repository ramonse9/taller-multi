import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-si-no',
  imports: [CommonModule],
  templateUrl: './badge-si-no.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeSiNoComponent{

  siNo = input.required<boolean>();

}
