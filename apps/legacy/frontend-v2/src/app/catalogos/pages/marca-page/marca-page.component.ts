import { Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MarcaDetailsComponent } from "./marca-details/marca-details.component";
import { MarcasService } from '../../services/marcas.service';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-marca-page',
  imports: [SpinnerComponent, MarcaDetailsComponent],
  templateUrl: './marca-page.component.html'
})
export class MarcaPageComponent {

  activatedRoute = inject( ActivatedRoute )
  router = inject(Router)

  marcasService = inject(MarcasService)

  marcaId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'] )
    )
  )

  marcaRXResource = rxResource({
    params: () => ({id: this.marcaId()}),
    stream: ({params}) => {
      return this.marcasService.getMarca( params.id )
    }
  })

  redirectEffect = effect( () => {

    if( this.marcaRXResource.error() ){
      this.router.navigate(['/catalogos/marcas'])
    }

  })

}

export default MarcaPageComponent;
