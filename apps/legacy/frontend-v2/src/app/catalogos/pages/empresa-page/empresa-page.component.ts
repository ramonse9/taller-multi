import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EmpresaDetailsComponent } from './empresa-details/empresa-details.component';
import { EmpresasService } from '@catalogos/services/empresas.service';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-empresa-page',
  imports: [SpinnerComponent, EmpresaDetailsComponent],
  templateUrl: './empresa-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPageComponent {

  activatedRoute = inject(ActivatedRoute)
  router = inject(Router)

  empresasService = inject(EmpresasService)

  empresaId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  empresaRXResource = rxResource({
    params: () => ({id: this.empresaId()}),
    stream: ({params}) => {
      return this.empresasService.getEmpresa( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.empresaRXResource.error()){
      this.router.navigate(['/catalogos/empresas'])
    }
  })

 }

 export default EmpresaPageComponent
