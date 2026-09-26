import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ModelosService } from '../../services/modelos.service';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ModelosTableComponent } from '../../components/tables/modelos-table/modelos-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../../shared/components/pagination/pagination.service';
import { BusquedaGeneralComponent } from '../../../shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { of } from 'rxjs';
import { DrawerModeloNuevoEditarComponent } from "@catalogos/components/drawers/drawer-modelo-nuevo-editar/drawer-modelo-nuevo-editar.component";

@Component({
  selector: 'app-modelos-page',
  imports: [ModelosTableComponent, PaginationComponent, FormsModule, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerFormContainerComponent, DrawerModeloNuevoEditarComponent],
  templateUrl: './modelos-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class ModelosPageComponent {

  modelosService = inject(ModelosService);
  paginationService = inject(PaginationService);
  router = inject(Router)

  itemsPerPage = signal(6)
  textoFiltrar = signal('')

  idSeleccionado = signal<string | null>(null)
  isOpenDrawer = signal(false);


  get EnumCeroRegistros(){
    return EnumCeroRegistros
  }

  idNuevo(){
    this.idSeleccionado.set( null );
    this.isOpenDrawer.set(true);
  }

  idSeleccionar(id: string){
    this.idSeleccionado.set( id );
    this.isOpenDrawer.set(true);
  }

  idDeseleccionar(){
    this.isOpenDrawer.set(false);
    setTimeout(()=> this.idSeleccionado.set(null), 300 );
  }

  reload(){
    this.modelosRXResource.reload()
  }

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/modelos'], {
      queryParams: { page: 1 }
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/modelos'], {
      queryParams: { page: 1 }
    })

  }

  modelosRXResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar()}),
    stream: ({params}) => {

      return this.modelosService.getModelos( {
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })


  modeloRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado()}),
    stream: ({params}) => {

      if( !params.id ) return of(null)

      return this.modelosService.getModelo( params.id )

    }
  })

}

export default ModelosPageComponent;
