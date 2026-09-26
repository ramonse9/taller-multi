import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-error-layout',
  imports: [RouterOutlet],
  templateUrl: './error-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorLayoutComponent { }
