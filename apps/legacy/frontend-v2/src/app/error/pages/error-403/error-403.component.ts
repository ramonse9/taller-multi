import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-403',
  imports: [RouterLink],
  templateUrl: './error-403.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error403Component { }
