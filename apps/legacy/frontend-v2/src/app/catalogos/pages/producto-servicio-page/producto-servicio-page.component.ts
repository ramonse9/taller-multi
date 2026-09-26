import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProductoServicioDetailsComponent } from './producto-servicio-details/producto-servicio-details.component';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-producto-servicio-page',
  imports: [ProductoServicioDetailsComponent, SpinnerComponent],
  templateUrl: './producto-servicio-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoServicioPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  productosServiciosService = inject( ProductosServiciosService )

  productoServicioId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  productoServicioRXResource = rxResource({
    params: () => ({id: this.productoServicioId()}),
    stream: ({params}) => {
      return this.productosServiciosService.getProductoServicio( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.productoServicioRXResource.error()){
      this.router.navigate(['/catalogos/productosservicios'])
    }
  })

}

export default ProductoServicioPageComponent
