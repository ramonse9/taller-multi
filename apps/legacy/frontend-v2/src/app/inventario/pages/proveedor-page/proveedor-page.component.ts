import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ProveedoresService } from '@catalogos/services/proveedores.service';
import { ProveedorDetailsComponent } from './proveedor-details/proveedor-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-proveedor-page',
  imports: [ProveedorDetailsComponent, SpinnerComponent],
  templateUrl: './proveedor-page.component.html',
})
export class ProveedorPageComponent {

  activatedRoute = inject(ActivatedRoute)
  router = inject(Router)

  proveedoresService = inject(ProveedoresService)

  proveedorId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  proveedorRXResource = rxResource({
    params: () => ({id: this.proveedorId()}),
    stream: ({params}) => {
      return this.proveedoresService.getProveedor( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.proveedorRXResource.error()){
      this.router.navigate(['/operaciones/proveedores'])
    }
  })

}

export default ProveedorPageComponent;
