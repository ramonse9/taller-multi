import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { VehiculosService } from '@catalogos/services/vehiculos.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { VehiculosTableComponent } from '@catalogos/components/tables/vehiculos-table/vehiculos-table.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { of } from 'rxjs';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardVehiculoComponent } from "@catalogos/components/cards/card-vehiculo/card-vehiculo.component";
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { DrawerVehiculoNuevoEditarComponent } from "@catalogos/components/drawers/drawer-vehiculo-nuevo-editar/drawer-vehiculo-nuevo-editar.component";

@Component({
  selector: 'app-vehiculos-page',
  imports: [PaginationComponent, VehiculosTableComponent, BusquedaGeneralComponent, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardVehiculoComponent, DrawerFormContainerComponent, DrawerVehiculoNuevoEditarComponent],
  templateUrl: './vehiculos-page.component.html',
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
export class VehiculosPageComponent {

  vehiculosService = inject(VehiculosService)
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6);
  textoFiltrar = signal('')

  soloCards = signal( true );

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
    this.vehiculosRXResource.reload()
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/vehiculos'],{
      queryParams: { page: 1}
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/vehiculos'], {
      queryParams: { page: 1 }
    })

  }

  vehiculosRXResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
    stream: ({params}) => {
      return this.vehiculosService.getVehiculos({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })
    }

  })

  vehiculoRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({params}) => {

      if( !params.id ) return of(null);

      return this.vehiculosService.getVehiculo( params.id )
    }

  })

}

export default VehiculosPageComponent;
