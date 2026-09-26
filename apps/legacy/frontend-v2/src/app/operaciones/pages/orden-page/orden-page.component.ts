import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { OrdenDetailsComponent } from './orden-details/orden-details.component';
import { OrdenInformacionPageComponent } from './orden-informacion-page/orden-informacion-page.component';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

@Component({
  selector: 'app-orden-page',
  imports: [SpinnerComponent, OrdenDetailsComponent, OrdenInformacionPageComponent],
  templateUrl: './orden-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenPageComponent {

  activatedRoute = inject( ActivatedRoute );
  router = inject(Router);

  ordenesService = inject(OrdenesService);

  ordenId = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['id'])
    )
  )

  modo = toSignal(
    this.activatedRoute.params.pipe(
      map( params => params['modo'])
    )
  )

  refrescarInformacion(){
    this.ordenRXResource.reload()
  }

  ordenRXResource = rxResource({
    params: () => ({id: this.ordenId()}),
    stream: ({params}) => {
      return this.ordenesService.getOrden( params.id )
    }
  })

  onLimpiarVehiculo(){
    this.ordenRXResource.update( c => {
      if(!c) return c;
      const test = { ...c, vehiculo: null }
      return test
    })
  }

  onLimpiarCliente(){
    this.ordenRXResource.update( c => {
      if(!c) return c;
      const test = { ...c, cliente: null }
      return test
    })
  }

  onLimpiarEmpresa(){
    this.ordenRXResource.update( c => {
      if(!c) return c;
      const test = { ...c, empresa: null }
      return test
    })
  }

  redirectEffect = effect( () => {
    if( this.ordenRXResource.error()){
      this.router.navigate(['/operaciones/ordenes'])
    }
  })

 }

 export default OrdenPageComponent;
