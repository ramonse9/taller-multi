import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FacturasTableComponent } from '@facturas/components/tables/facturas-table/facturas-table.component';
import { FacturasService } from '@facturas/services/facturas.service';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-facturas-page',
  imports: [PaginationComponent, FacturasTableComponent, BusquedaGeneralComponent],
  templateUrl: './facturas-page.component.html',
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
export class FacturasPageComponent {

  facturasService = inject(FacturasService);
  paginationService = inject(PaginationService);
  router = inject(Router);

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  selectPerPageChange( itemsPerPage: number ){

    this.itemsPerPage.set( itemsPerPage );

    this.router.navigate(['/facturas/facturas'],{
      queryParams: {page:1}
    })

  }

  filtrar( event: string){
    this.textoFiltrar.set( event );

    this.router.navigate([], {

    });

  }

  facturasRXResource = rxResource({
    params: () => ({ page: this.paginationService.currentPage(), limit: this.itemsPerPage(), filtro: this.textoFiltrar() }),
    stream: ({params}) =>{
      return this.facturasService.getFacturas({
        page: params.page,
        limit: params.limit,
        filtro: params.filtro
      })

    }
  })

}

export default FacturasPageComponent;
