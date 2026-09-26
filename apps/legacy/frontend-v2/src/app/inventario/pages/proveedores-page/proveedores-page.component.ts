import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PaginationService } from '../../../shared/components/pagination/pagination.service';
import { BusquedaGeneralComponent } from '../../../shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { ProveedoresService } from '@catalogos/services/proveedores.service';
import { DrawerBaseBottomComponent } from "@shared/components/drawers/drawer-base-bottom/drawer-base-bottom.component";
import { of } from 'rxjs';
import { DrawerProveedorNuevoEditarComponent } from "@inventario/components/drawers/drawer-proveedor-nuevo-editar/drawer-proveedor-nuevo-editar.component";
import { CargandoDetallesComponent } from "@shared/components/loading/cargando-detalles/cargando-detalles.component";
import DrawerIdCreatedComponent from "@shared/components/drawers/drawer-id-created/drawer-id-created.component";
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { CardProveedorComponent } from "@inventario/components/cards/card-proveedor/card-proveedor.component";

@Component({
  selector: 'app-proveedores-page',
  imports: [PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerBaseBottomComponent, DrawerProveedorNuevoEditarComponent, CargandoDetallesComponent, DrawerIdCreatedComponent, CardsContainerComponent, BadgeMessageComponent, CardProveedorComponent],
  templateUrl: './proveedores-page.component.html',
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
export class ProveedoresPageComponent {

  proveedoresService = inject(ProveedoresService);
  paginationService = inject(PaginationService);
  router = inject(Router)

  itemsPerPage = signal(6)
  textoFiltrar = signal('')

  idSeleccionado = signal<string | null>(null)
  isOpenDrawer = signal(false);

  get EnumCeroRegistros(){
      return EnumCeroRegistros
    }

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/proveedores'], {
      queryParams: { page: 1 }
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/proveedores'], {
      queryParams: { page: 1 }
    })

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
    this.proveedoresRXResource.reload()
  }

  proveedoresRXResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
    stream: ({params}) => {

      return this.proveedoresService.getProveedores({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })
    }
  })

  proveedorRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({ params }) => {

      if( !params.id ) return of(null);

      return this.proveedoresService.getProveedor( params.id )
    }

  });

}

export default ProveedoresPageComponent;
