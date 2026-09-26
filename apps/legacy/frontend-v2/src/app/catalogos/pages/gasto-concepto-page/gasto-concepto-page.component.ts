import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';


@Component({
  selector: 'app-gasto-concepto-page',
  imports: [],
  templateUrl: './gasto-concepto-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GastoConceptoPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  //gastosConceptosService = inject( GastosService )

  gastoConceptoId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  /*gastoConceptoRXResource = rxResource({
    params: () => ({id: this.gastoConceptoId()}),
    stream: ({params}) => {
      return this.gastosConceptosService.getGastoConcepto( params.id )
    }
  })*/

  /*redirectEffect = effect( () => {
    if( this.gastoConceptoRXResource.error()){
      this.router.navigate(['/catalogos/gastosconceptos'])
    }
  })*/

}

export default GastoConceptoPageComponent
