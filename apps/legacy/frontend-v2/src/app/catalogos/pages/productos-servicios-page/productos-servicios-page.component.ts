import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { ProductosServiciosService } from '@catalogos/services/productosServicios.service';
import { ProductosServiciosTableComponent } from '@catalogos/components/tables/productos-servicios-table/productos-servicios-table.component';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';

@Component({
  selector: 'app-productos-servicios-page',
  imports: [PaginationComponent, ProductosServiciosTableComponent, BusquedaGeneralComponent, PageButtonInicioComponent],
  templateUrl: './productos-servicios-page.component.html',
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
export class ProductosServiciosPageComponent {

    productosServiciosService = inject( ProductosServiciosService )
    paginationService = inject( PaginationService )
    router = inject( Router )

    itemsPerPage = signal(6);
    textoFiltrar = signal('')

    selectPerPageChange( itemsPerPage: number ){

      this.itemsPerPage.set( itemsPerPage )
      this.router.navigate(['/catalogos/productosservicios'], {
        queryParams: {page:1}
      })

    }

    filtrar(event: string){

      this.textoFiltrar.set( event )

      this.router.navigate(['/catalogos/productosservicios'], {
        queryParams: { page: 1 }
      })

    }

    productosServiciosRXResource = rxResource({
      params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
      stream: ({params}) =>{
        return this.productosServiciosService.getProductosServicios({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
    })
}

export default ProductosServiciosPageComponent;
