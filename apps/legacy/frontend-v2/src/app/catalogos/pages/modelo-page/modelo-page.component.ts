import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ModelosService } from '../../services/modelos.service';
import { ModeloDetailsComponent } from "./modelo-details/modelo-details.component";
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-modelo-page',
  imports: [SpinnerComponent, ModeloDetailsComponent],
  templateUrl: './modelo-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModeloPageComponent {

  activatedRoute = inject( ActivatedRoute )
  router = inject(Router)

  modelosService = inject(ModelosService)

  modeloId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'] )
    )
  )

  modeloRXResource = rxResource({
    params: () => ({id: this.modeloId()}),
    stream: ({params}) => {
      return this.modelosService.getModelo( params.id )
    }
  })

  redirectEffect = effect( () => {

    if( this.modeloRXResource.error() ){
      this.router.navigate(['/catalogos/modelos'])
    }

  })
}

export default ModeloPageComponent;
