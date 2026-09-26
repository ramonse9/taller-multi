import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from "./shared/components/toast-container/toast-container.component";
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Multiservicios 24/7';
}
