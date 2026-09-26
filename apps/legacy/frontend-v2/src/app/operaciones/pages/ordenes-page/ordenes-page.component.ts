import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { OrdenesTableComponent } from '@operaciones/components/tables/ordenes-table/ordenes-table.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { CardsOrdenesComponent } from '@operaciones/components/cards/cards-ordenes/cards-ordenes.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';

@Component({
  selector: 'app-ordenes-page',
  imports: [OrdenesTableComponent, PaginationComponent, BusquedaGeneralComponent, CardsOrdenesComponent, PageButtonInicioComponent ],
  templateUrl: './ordenes-page.component.html',
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
export class OrdenesPageComponent implements OnInit {

  ngOnInit(){
    this.ordenesRXResource.reload()
  }

  ordenesService = inject( OrdenesService )
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

  selectPerPageChange( itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/operaciones/ordenes'], {
      queryParams: { page: 1}
    })
  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/operaciones/ordenes'], {
      queryParams: { page: 1 }
    })

  }

  ordenesRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar()
    }),
    stream: ({params}) => {
      return this.ordenesService.getOrdenes({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro
      })
    }
  })

}

export default OrdenesPageComponent;
