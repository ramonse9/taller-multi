import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { ClientesService } from '@catalogos/services/clientes.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { ClientesTableComponent } from '@catalogos/components/tables/clientes-table/clientes-table.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { DrawerClienteNuevoEditarComponent } from "@catalogos/components/drawers/drawer-cliente-nuevo-editar/drawer-cliente-nuevo-editar.component";
import { of } from 'rxjs';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardClienteComponent } from "@catalogos/components/cards/card-cliente/card-cliente.component";

@Component({
  selector: 'app-clientes-page',
  imports: [PaginationComponent, ClientesTableComponent, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerFormContainerComponent, DrawerClienteNuevoEditarComponent, CardsContainerComponent, BadgeMessageComponent, CardClienteComponent],
  templateUrl: './clientes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(15px)', position: 'absolute', width: '100%' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({position: 'absolute', width: '100%'}),
        animate('400ms ease-in', style({ opacity: 0, transform: 'translateX(-15px)' }))
      ])
    ])
  ]
})
export class ClientesPageComponent {

  clientesService = inject( ClientesService )
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6)
  textoFiltrar = signal('')

  soloCards = signal( true );

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
    this.clientesRXResource.reload()
  }

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange( itemsPerPage: number ){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/clientes'],{
      queryParams: {page: 1}
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/clientes'], {
      queryParams: { page: 1 }
    })

  }

  clientesRXResource = rxResource({

    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
    stream: ({params}) => {
      return this.clientesService.getClientes({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })
    }

  })

  clienteRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({ params }) => {

      if( !params.id ) return of(null);

      return this.clientesService.getCliente( params.id )
    }

  });


}
export default ClientesPageComponent;
