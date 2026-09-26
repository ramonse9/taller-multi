import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GastoDetailsComponent } from './gasto-movimiento-details/gasto-movimiento-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';
import { GastosMovimientosService } from '@pagos/services/gastos-movimientos.service';

@Component({
  selector: 'app-gasto-movimiento-page',
  imports: [GastoDetailsComponent, SpinnerComponent],
  templateUrl: './gasto-movimiento-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastoMovimientoPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  gastosMovimientosService = inject( GastosMovimientosService )

  gastoId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  gastoMovimientoRXResource = rxResource({
    params: () => ({id: this.gastoId()}),
    stream: ({params}) => {
      return this.gastosMovimientosService.getGastoMovimiento( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.gastoMovimientoRXResource.error()){
      this.router.navigate(['/pagos/gastos'])
    }
  })

}

export default GastoMovimientoPageComponent
