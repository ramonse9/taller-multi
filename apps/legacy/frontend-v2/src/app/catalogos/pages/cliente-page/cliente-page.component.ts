import { Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ClientesService } from '@catalogos/services/clientes.service';
import { ClienteDetailsComponent } from './cliente-details/cliente-details.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-cliente-page',
  imports: [ClienteDetailsComponent, SpinnerComponent],
  templateUrl: './cliente-page.component.html',
})
export class ClientePageComponent {

  activatedRoute = inject(ActivatedRoute)
  router = inject(Router)

  clientesService = inject(ClientesService)

  clienteId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  clienteRXResource = rxResource({
    params: () => ({id: this.clienteId()}),
    stream: ({params}) => {
      return this.clientesService.getCliente( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.clienteRXResource.error()){
      this.router.navigate(['/operaciones/clientes'])
    }
  })

}

export default ClientePageComponent;
