import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { InventarioService } from '@inventario/services/inventario.service';
import { InventarioMovimientosTableComponent } from "@inventario/components/tables/inventario-movimientos-table/inventario-movimientos-table.component";

@Component({
  selector: 'app-inventario-movimientos-page',
  imports: [PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, InventarioMovimientosTableComponent],
  templateUrl: './inventario-movimientos-page.component.html',
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
export class InventarioMovimientosPageComponent {

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

    inventarioMovimientosRXResource = rxResource({
      params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
      stream: ({params}) =>{
        return this.inventarioService.getInventarioMovimientos({
          page: params.page,
          limit: params.limit,
          filtro: params.filtro
        })

      }
    })
}

export default InventarioMovimientosPageComponent;
