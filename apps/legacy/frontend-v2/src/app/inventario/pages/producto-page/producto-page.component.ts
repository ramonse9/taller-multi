import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProductoDetailsComponent } from './producto-details/producto-details.component';
import { ProductosService } from '@inventario/services/productos.service';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-producto-page',
  imports: [ProductoDetailsComponent, SpinnerComponent],
  templateUrl: './producto-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  productosService = inject( ProductosService )

  idProducto = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  productoRXResource = rxResource({
    params: () => ({id: this.idProducto()}),
    stream: ({params}) => {
      return this.productosService.getProducto( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.productoRXResource.error()){
      this.router.navigate(['/inventario/productos'])
    }
  })

}

export default ProductoPageComponent
