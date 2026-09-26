import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CotizacionesService } from '@operaciones/services/cotizaciones.service';
import { map } from 'rxjs';
import { CotizacionDetailsComponent } from './cotizacion-details/cotizacion-details.component';
import { CotizacionInformacionPageComponent } from './cotizacion-informacion-page/cotizacion-informacion-page.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-cotizacion-page',
  imports: [SpinnerComponent, CotizacionInformacionPageComponent, CotizacionDetailsComponent],
  templateUrl: './cotizacion-page.component.html',
})
export class CotizacionPageComponent {

  activatedRoute = inject( ActivatedRoute );
  router = inject(Router);

  cotizacionesService = inject(CotizacionesService);

  cotizacionId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'])
    )
  )

  modo = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['modo'])
    )
  )

  cotizacionRXResource = rxResource({
    params: () => ({id: this.cotizacionId()}),
    stream: ({params}) => {
      return this.cotizacionesService.getCotizacion( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.cotizacionRXResource.error()){
      this.router.navigate(['/operaciones/cotizaciones'])
    }
  })

 }

 export default CotizacionPageComponent;

