import { Component, inject, OnInit, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CardsCotizacionesComponent } from './../../components/cards/cards-cotizaciones/cards-cotizaciones.component';
import { CotizacionesTableComponent } from './../../components/tables/cotizaciones-table/cotizaciones-table.component';
import { CotizacionesService } from '@operaciones/services/cotizaciones.service';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { tap } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';

@Component({
  selector: 'app-cotizaciones-page',
  imports: [CotizacionesTableComponent, PaginationComponent, BusquedaGeneralComponent, CardsCotizacionesComponent, PageButtonInicioComponent],
  templateUrl: './cotizaciones-page.component.html',
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
export class CotizacionesPageComponent implements OnInit {

  ngOnInit(){
    this.cotizacionesRXResource.reload()
  }

  cotizacionesService = inject( CotizacionesService )
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());
  //opcionCards = true;
  soloCards = signal( true );

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange(itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/operaciones/cotizaciones'], {
      queryParams: { page: 1 }
    })

  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/operaciones/cotizaciones'], {
      queryParams: { page: 1 }
    })

  }

  cotizacionesRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar()
    }),
    stream: ({params}) => {
      return this.cotizacionesService.getCotizaciones({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro
      })
    }
  })

}

export default CotizacionesPageComponent;

