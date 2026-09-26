import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { BusquedaGeneralComponent } from '@shared/components/busqueda-general/busqueda-general.component';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import * as ExcelJS from 'exceljs';
//import saveAs from 'file-saver';
import * as saveAs from 'file-saver';
import { PaginationComponent } from '@shared/components/pagination/pagination.component';
import { PageButtonInicioComponent } from '@shared/components/forms/page-button-inicio/page-button-inicio.component';
import { CardsContainerComponent } from "@shared/components/cards/cards-container/cards-container.component";
import { BadgeMessageComponent } from "@shared/components/badges/badge-message/badge-message.component";
import { EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { CardEmpleadoComponent } from "@catalogos/components/cards/card-empleado/card-empleado.component";
import { DrawerFormContainerComponent } from "@shared/components/drawers/drawer-form-container/drawer-form-container.component";
import { DrawerEmpleadoNuevoEditarComponent } from "@catalogos/components/drawers/drawer-empleado-nuevo-editar/drawer-empleado-nuevo-editar.component";
import { EmpleadosService } from '@pagos/services/empleados.service';


@Component({
  selector: 'app-gastos-page',
  imports: [BusquedaGeneralComponent, CommonModule, PaginationComponent, PageButtonInicioComponent, CardsContainerComponent, BadgeMessageComponent, CardEmpleadoComponent, DrawerFormContainerComponent, DrawerEmpleadoNuevoEditarComponent],
  templateUrl: './empleados-page.component.html',
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
export class EmpleadosPageComponent {

  mesSeleccionado = signal<number>(new Date().getMonth() + 1); // 1-12
  anioSeleccionado = signal<number>(new Date().getFullYear());

  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  anios = computed(() => {
    const anioActual = new Date().getFullYear();
    return Array.from(
      { length: 7 },
      (_, i) => anioActual - i
    );
  });

  empleadosService = inject(EmpleadosService)
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
    this.empleadosRXResource.reload()
  }

  mostrarCards(mostrar: boolean){
    this.soloCards.set( mostrar );
  }

  selectPerPageChange( itemsPerPage: number){

    this.itemsPerPage.set( itemsPerPage )

    this.router.navigate(['/catalogos/empleados'], {
      queryParams: { page: 1}
    })
  }

  filtrar(event: string){

    this.textoFiltrar.set( event )

    this.router.navigate(['/catalogos/empleados'], {
      queryParams: { page: 1 }
    })

  }

  /*recargarGastosConceptosConGastos(){
    this.gastosConceptosConGastosRXResource.reload();
  }*/

  empleadosRXResource = rxResource({
    params: () => ({
      page: this.paginationService.currentPage(),
      limit: this.itemsPerPage(),
      filtro: this.textoFiltrar(),
      mes: this.mesSeleccionado(),
      anio: this.anioSeleccionado()
    }),
    stream: ({params}) => {
      return this.empleadosService.getEmpleados({
        limit: params.limit,
        page: params.page,
        filtro: params.filtro,
      },
      )
    }
  })

  empleadoRXResource = rxResource({
    params: () => ({ id: this.idSeleccionado() }),
    stream: ({params}) => {

      if(!params.id ) return of(null)

      return this.empleadosService.getEmpleado( params.id )
    }
  })

  // Métodos para cambiar mes/año
  /*cambiarMes(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.mesSeleccionado.set(Number(valor));

    this.gastosConceptosConGastosRXResource.reload();
  }*/

  /*cambiarAnio(event: Event) {
    const valor = (event.target as HTMLSelectElement).value;
    this.anioSeleccionado.set(Number(valor));

    this.gastosConceptosConGastosRXResource.reload()
  }*/

  /*mesAnterior() {
    let nuevoMes = this.mesSeleccionado() - 1;
    let nuevoAnio = this.anioSeleccionado();

    // Si estamos en enero, vamos a diciembre del año anterior
    if (nuevoMes === 0) {
      nuevoMes = 12;
      nuevoAnio = nuevoAnio - 1;
    }

    this.actualizarFecha(nuevoMes, nuevoAnio);
  }*/

  /*mesSiguiente() {
    let nuevoMes = this.mesSeleccionado() + 1;
    let nuevoAnio = this.anioSeleccionado();

    // Si estamos en diciembre, vamos a enero del año siguiente
    if (nuevoMes === 13) {
      nuevoMes = 1;
      nuevoAnio = nuevoAnio + 1;
    }

    this.actualizarFecha(nuevoMes, nuevoAnio);
  }*/

  /*private actualizarFecha(mes: number, anio: number) {
    this.mesSeleccionado.set(mes);
    this.anioSeleccionado.set(anio);
    this.gastosConceptosConGastosRXResource.reload();
  }*/

  /*irAlMesActual() {
    const fechaActual = new Date();
    this.actualizarFecha(
      fechaActual.getMonth() + 1,
      fechaActual.getFullYear()
    );
  }*/

}

export default EmpleadosPageComponent;
