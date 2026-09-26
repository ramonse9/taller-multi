import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';
import { EmpleadosService } from '@pagos/services/empleados.service';

@Component({
  selector: 'app-empleado-page',
  imports: [SpinnerComponent ],
  templateUrl: './empleado-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpleadoPageComponent {

  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  empleadosService = inject(EmpleadosService)

  empleadoId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params["id"])
    )
  )

  empleadoRXResource = rxResource({
    params: () => ({id: this.empleadoId()}),
    stream: ({params}) => {
      return this.empleadosService.getEmpleado( params.id )
    }
  })

  redirectEffect = effect( () => {
    if( this.empleadoRXResource.error()){
      this.router.navigate(['/catalogo/empleados'])
    }
  })

}

export default EmpleadoPageComponent
