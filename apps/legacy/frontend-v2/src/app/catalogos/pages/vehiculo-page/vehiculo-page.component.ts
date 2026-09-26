import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { VehiculoDetailsComponent } from './vehiculo-details/vehiculo-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-vehiculo-page',
  imports: [SpinnerComponent, VehiculoDetailsComponent],
  templateUrl: './vehiculo-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiculoPageComponent {

  activatedRoute = inject( ActivatedRoute )
  router = inject(Router)

  vehiculosService = inject(VehiculosService)

  vehiculoId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'] )
    )
  )

  vehiculoRXResource = rxResource({
    params: () => ({id: this.vehiculoId()}),
    stream: ({params}) => {
      return this.vehiculosService.getVehiculo( params.id )
    }
  })

  redirectEffect = effect( () => {

    if( this.vehiculoRXResource.error() ){
      this.router.navigate(['/catalogos/vehiculos'])
    }

  })

}

export default VehiculoPageComponent;
