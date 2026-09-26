import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { map } from 'rxjs';
import { FacturarOrdenDetailsComponent } from "./facturar-orden-details/facturar-orden-details.component";
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-facturar-orden-page',
  imports: [SpinnerComponent, FacturarOrdenDetailsComponent],
  templateUrl: './facturar-orden-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturarOrdenPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  ordenesService = inject(OrdenesService)

  ordenId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  ordenRXResource = rxResource({
    params: () => ({id: this.ordenId()}),
    stream: ({params}) => {
      return this.ordenesService.getOrden( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.ordenRXResource.error()){
      this.router.navigate(['/operaciones/ordenes'])
    }
  })

}

export default FacturarOrdenPageComponent;
