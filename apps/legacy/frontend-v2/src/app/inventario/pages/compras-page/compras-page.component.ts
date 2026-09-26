import { Component, inject, OnInit, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { ComprasService } from '@inventario/services/compras.service';
import { FormBuilder } from '@angular/forms';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { EnumCategoria, EnumCeroRegistros, EnumEstatusCompra } from '@shared/enums/general-estatus.enum';
import { CommonModule } from '@angular/common';
import { DrawerBaseBottomComponent } from "@shared/components/drawers/drawer-base-bottom/drawer-base-bottom.component";
import { DrawerCompraInformacionComponent } from "@inventario/components/drawers/drawer-compra-informacion/drawer-compra-informacion.component";
import { DrawerCompraNuevoComponent } from '@inventario/components/drawers/drawer-compra-nuevo/drawer-compra-nuevo.component';
import { ComprasTableComponent } from "@inventario/components/tables/compras-table/compras-table.component";
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { CardCompraComponent } from '@inventario/components/cards/card-compra/card-compra.component';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { CardsContainerComponent } from '@shared/components/cards/cards-container/cards-container.component';

@Component({
  selector: 'app-compras-page',
  imports: [CommonModule, PaginationComponent, BusquedaGeneralComponent, CardsContainerComponent, CardCompraComponent, BadgeMessageComponent, PageButtonInicioComponent, EstatusBadgeComponent, DrawerCompraInformacionComponent, DrawerCompraNuevoComponent, ComprasTableComponent, DrawerFormContainerComponent],
  templateUrl: './compras-page.component.html',
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
export class ComprasPageComponent implements OnInit {

  comprasService = inject( ComprasService )
  paginationService = inject( PaginationService )
  router = inject(Router)

  itemsPerPage = signal(6);
  textoFiltrar = signal('');

  refreshDate = signal( new Date());
  //opcionCards = true;
  soloCards = signal( true );

  fb = inject(FormBuilder)

  idSeleccionado = signal<string | null>(null)

  //ESTATUS
  //estatusSeleccionados: string[] = [];
  estatusSeleccionados = signal<string[]>(['todos']);

  isOpenDrawer = signal(false);

  estatusForm = this.fb.group({
    todos: [true],
    borrador: [false],
    confirmada: [false],
    cancelada: [false]
  });

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

  get EnumCategoria() {
    return EnumCategoria;
  }

  get EnumEstatusCompra(){
    return EnumEstatusCompra;
  }

  ngOnInit(){
    //this.comprasRXResource.reload()
  }

  onTodosChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.estatusForm.patchValue({
      todos: checked,
      borrador: false,
      confirmada: false,
      cancelada: false
    });
    this.actualizarListado();
  }

  onEstatusChange(nombre: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.estatusForm.patchValue({ [nombre]: checked, todos: false });
    this.actualizarListado();
  }

  actualizarListado() {
    const { todos, borrador, confirmada, cancelada } = this.estatusForm.value;
    //this.estatusSeleccionados = [];
    const seleccionados: string[] = [];

    if (todos) {
      seleccionados.push('todos');
    } else {
      if (borrador) seleccionados.push(EnumEstatusCompra.BORRADOR);
      if (confirmada) seleccionados.push(EnumEstatusCompra.CONFIRMADA);
      if (cancelada) seleccionados.push(EnumEstatusCompra.CANCELADA);
    }

    // Si no hay ninguno seleccionado, forzar "Todos"
    if (seleccionados.length === 0) {
      this.estatusForm.patchValue({
        todos: true,
        borrador: false,
        confirmada: false,
        cancelada: false
      });
      seleccionados.push('todos');
    }

    this.estatusSeleccionados.set( seleccionados );

  }

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

  idNuevo(){
    this.idSeleccionado.set(null);
    this.isOpenDrawer.set( true);
  }

  idSeleccionar(id: string){
    this.idSeleccionado.set( id );
    this.isOpenDrawer.set( true );
  }

  idDeseleccionar(){
    this.isOpenDrawer.set( false );
    setTimeout( () => this.idSeleccionado.set(null), 300 )
  }

  reload(){
    this.comprasRXResource.reload()
  }

  comprasRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar(),
      estatus: this.estatusSeleccionados()
    }),
    stream: ({params}) => {
      return this.comprasService.getCompras({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro
      },
      params.estatus
      )
    }
  })

  compraRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({ params }) => {

      if( !params.id ) return of(null);

      return this.comprasService.getCompra( params.id )
    }

  });

}

export default ComprasPageComponent;

