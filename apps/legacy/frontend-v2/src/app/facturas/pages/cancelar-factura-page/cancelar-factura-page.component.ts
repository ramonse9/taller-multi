import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturasService } from '@facturas/services/facturas.service';
import { map } from 'rxjs';
import { CancelarFacturaDetailsComponent } from './cancelar-factura-details/cancelar-factura-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-cancelar-factura-page',
  imports: [SpinnerComponent, CancelarFacturaDetailsComponent],
  templateUrl: './cancelar-factura-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelarFacturaPageComponent {

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
      return this.facturasService.getFacturaMinimal( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.facturaRXResource.error()){
      this.router.navigate(['/inicio/accesos'])
    }
  })
}

export default CancelarFacturaPageComponent;
