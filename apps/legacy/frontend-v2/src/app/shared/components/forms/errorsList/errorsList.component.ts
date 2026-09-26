import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-errors-list',
  imports: [],
  templateUrl: './errorsList.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErroresListComponent {
  erroresList = input<string[]>()
}
