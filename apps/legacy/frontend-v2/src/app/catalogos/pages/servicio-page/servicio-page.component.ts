import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ServiciosService } from '@catalogos/services/servicios.service';
import { ServicioDetailsComponent } from './servicio-details/servicio-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-servicio-page',
  imports: [ServicioDetailsComponent, SpinnerComponent],
  templateUrl: './servicio-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicioPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  serviciosService = inject( ServiciosService )

  servicioId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  servicioRXResource = rxResource({
    params: () => ({id: this.servicioId()}),
    stream: ({params}) => {
      return this.serviciosService.getServicio( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.servicioRXResource.error()){
      this.router.navigate(['/catalogos/servicios'])
    }
  })

}

export default ServicioPageComponent
