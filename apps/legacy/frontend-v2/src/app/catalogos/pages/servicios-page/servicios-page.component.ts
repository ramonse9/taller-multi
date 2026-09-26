import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { ServiciosService } from '@catalogos/services/servicios.service';
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { DrawerServicioNuevoEditarComponent } from "@catalogos/components/drawers/drawer-servicio-nuevo-editar/drawer-servicio-nuevo-editar.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { of } from 'rxjs';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardServicioComponent } from "@catalogos/components/cards/card-servicio/card-servicio.component";

@Component({
  selector: 'app-servicios-page',
  imports: [PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerFormContainerComponent, DrawerServicioNuevoEditarComponent, CardsContainerComponent, BadgeMessageComponent, CardServicioComponent],
  templateUrl: './servicios-page.component.html',
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
export class ServiciosPageComponent {

    serviciosService = inject( ServiciosService )
    paginationService = inject( PaginationService )
    router = inject( Router )

    itemsPerPage = signal(6);
    textoFiltrar = signal('')

    idSeleccionado = signal<string | null>(null)
    isOpenDrawer = signal(false);

    get EnumCeroRegistros(){
      return EnumCeroRegistros;
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
      this.serviciosRXResource.reload()
    }

    selectPerPageChange( itemsPerPage: number ){

      this.itemsPerPage.set( itemsPerPage )
      this.router.navigate(['/catalogos/servicios'], {
        queryParams: {page:1}
      })

    }

    filtrar(event: string){

      this.textoFiltrar.set( event )

      this.router.navigate(['/catalogos/servicios'], {
        queryParams: { page: 1 }
      })

    }

    serviciosRXResource = rxResource({
      params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
      stream: ({params}) =>{
        return this.serviciosService.getServicios({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
    })

    servicioRXResource = rxResource({
      params: () => ({ id: this.idSeleccionado()}),
      stream: ({params}) =>{

        if( !params.id ) return of(null);

        return this.serviciosService.getServicio(params.id)

      }
    })
}

export default ServiciosPageComponent;
