import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { GastosService } from '@catalogos/services/gastos.service';
import { GastosTableComponent } from "@pagos/components/tables/gastos-table/gastos-table.component";
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { CardGastoComponent } from "@catalogos/components/cards/card-gasto/card-gasto.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { of } from 'rxjs';
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { DrawerGastoNuevoEditarComponent } from "@catalogos/components/drawers/drawer-gasto-nuevo-editar/drawer-gasto-nuevo-editar.component";

@Component({
  selector: 'app-gastos-page',
  imports: [PaginationComponent, BusquedaGeneralComponent, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardGastoComponent, GastosTableComponent, DrawerFormContainerComponent, DrawerGastoNuevoEditarComponent],
  templateUrl: './gastos-page.component.html',
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
export class GastosPageComponent implements OnInit {

  ngOnInit(){
    this.gastosRXResource.reload()
  }

  gastosService = inject( GastosService )
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());
  //opcionCards = true;
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
    this.gastosRXResource.reload()
  }

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange( itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/gastosconceptos'], {
      queryParams: { page: 1}
    })
  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/gastosconceptos'], {
      queryParams: { page: 1 }
    })

  }

  gastosRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar()
    }),
    stream: ({params}) => {
      return this.gastosService.getGastos({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro
      })
    }
  })

  gastoRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({params}) => {

      if(!params.id) return of(null)

      return this.gastosService.getGasto( params.id );
    }
  })

}

export default GastosPageComponent;
