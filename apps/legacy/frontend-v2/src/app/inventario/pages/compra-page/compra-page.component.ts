import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CompraDetailsComponent } from './compra-details/compra-details.component';
import { CompraInformacionPageComponent } from './compra-informacion-page/compra-informacion-page.component';
import { ComprasService } from '@inventario/services/compras.service';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-compra-page',
  imports: [SpinnerComponent, CompraInformacionPageComponent, CompraDetailsComponent],
  templateUrl: './compra-page.component.html',
})
export class CompraPageComponent {

  activatedRoute = inject( ActivatedRoute );
  router = inject(Router);

  comprasService = inject(ComprasService);

  compraId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'])
    )
  )

  modo = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['modo'])
    )
  )

  compraRXResource = rxResource({
    params: () => ({id: this.compraId()}),
    stream: ({params}) => {
      return this.comprasService.getCompra( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.compraRXResource.error()){
      this.router.navigate(['/inventario/compras'])
    }
  })

 }

 export default CompraPageComponent;
