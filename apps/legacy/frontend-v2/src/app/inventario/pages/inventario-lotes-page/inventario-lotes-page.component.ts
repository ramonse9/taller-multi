import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { InventarioService } from '@inventario/services/inventario.service';
import { InventarioLotesTableComponent } from "@inventario/components/tables/inventario-lotes-table/inventario-lotes-table.component";

@Component({
  selector: 'app-inventario-lotes-page',
  imports: [PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, InventarioLotesTableComponent],
  templateUrl: './inventario-lotes-page.component.html',
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
export class InventarioLotesPageComponent {

    inventarioService = inject(InventarioService);
    paginationService = inject( PaginationService )
    router = inject( Router )

    itemsPerPage = signal(6);
    textoFiltrar = signal('')

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

    inventarioLotesRXResource = rxResource({
      params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
      stream: ({params}) =>{
        return this.inventarioService.getLotes({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
    })
}

export default InventarioLotesPageComponent;
