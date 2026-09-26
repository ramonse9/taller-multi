import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { Router } from '@angular/router';
import { MarcasService } from '../../services/marcas.service';
import { MarcasTableComponent } from '../../components/tables/marcas-table/marcas-table.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../../shared/components/pagination/pagination.service';
import { BusquedaGeneralComponent } from '../../../shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { of } from 'rxjs';
import { DrawerMarcaNuevoEditarComponent } from "@catalogos/components/drawers/drawer-marca-nuevo-editar/drawer-marca-nuevo-editar.component";
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";


@Component({
  selector: 'app-marcas-page',
  imports: [MarcasTableComponent, PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerFormContainerComponent, DrawerMarcaNuevoEditarComponent],
  templateUrl: './marcas-page.component.html',
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
export class MarcasPageComponent {

  marcasService = inject(MarcasService);
  paginationService = inject(PaginationService);
  router = inject(Router)

  itemsPerPage = signal(6)
  textoFiltrar = signal('')

  idSeleccionado = signal<string | null>(null)
  isOpenDrawer = signal(false);

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

    this.marcasRXResource.reload()
  }

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/marcas'], {
      queryParams: { page: 1 }
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/marcas'], {
      queryParams: { page: 1 }
    })

  }

  marcasRXResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
    stream: ({params}) => {

      return this.marcasService.getMarcas({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })
    }
  })


  marcaRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({ params }) => {

      if( !params.id ) return of(null);

      return this.marcasService.getMarca( params.id )
    }

  });

}

export default MarcasPageComponent;
