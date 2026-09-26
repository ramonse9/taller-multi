import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { ProductosService } from '@inventario/services/productos.service';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { DrawerProductoNuevoEditarComponent } from "@inventario/components/drawers/drawer-producto-nuevo-editar/drawer-producto-nuevo-editar.component";
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { ProductosTableComponent } from "@inventario/components/tables/productos-table/productos-table.component";
import { CardProductoComponent } from "@inventario/components/cards/card-producto/card-producto.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

@Component({
  imports: [CommonModule, PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, DrawerProductoNuevoEditarComponent, DrawerFormContainerComponent, CardsContainerComponent, BadgeMessageComponent, ProductosTableComponent, CardProductoComponent],
  templateUrl: './productos-page.component.html',
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
export class ProductosPageComponent {

    productosService = inject( ProductosService )
    paginationService = inject( PaginationService )
    router = inject( Router )

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
      this.productosRXResource.reload()
    }

    mostrarCards(mostrar: boolean){
      this.soloCards.set( mostrar );
    }

    selectPerPageChange( itemsPerPage: number ){

      this.itemsPerPage.set( itemsPerPage )
      this.router.navigate(['/inventario/productos'], {
        queryParams: {page:1}
      })

    }

    filtrar(event: string){

      this.textoFiltrar.set( event )

      this.router.navigate(['/inventario/productos'], {
        queryParams: { page: 1 }
      })

    }

    productosRXResource = rxResource({
      params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
      stream: ({params}) =>{

        return this.productosService.getProductos({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
    })

    productoRXResource = rxResource({
      params: () => ({ id: this.idSeleccionado() }),
      stream: ({ params }) => {

        if( !params.id ) return of(null);

        return this.productosService.getProducto( params.id )
      }

    });

}

export default ProductosPageComponent;
