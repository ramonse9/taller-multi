import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturasService } from '@facturas/services/facturas.service';
import { map } from 'rxjs';
import { FacturaInformacionComponent } from './factura-informacion/factura-informacion.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-factura-page',
  imports: [FacturaInformacionComponent, SpinnerComponent],
  templateUrl: './factura-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturaPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  facturasService = inject(FacturasService);

  facturaId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  facturaRXResource = rxResource({
    params: () => ({id: this.facturaId()}),
    stream: ({params}) => {
      return this.facturasService.getFactura( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.facturaRXResource.error()){
      this.router.navigate(['/facturas/facturas'])
    }
  })

}

export default FacturaPageComponent;
