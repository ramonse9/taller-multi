
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, input, linkedSignal, output, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-busqueda-general',
  imports: [FormsModule, NgIcon, CommonModule],
  templateUrl: './busqueda-general.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusquedaGeneralComponent {

  placeholder = input.required<string>();
  nuevaEntidad = input.required<string>();
  nuevaEntidadPagina = input<string>('');
  opcionNuevaEntidad = input<boolean>(true);

  opcionCards = input<boolean>(false);
  mostrarCards = linkedSignal( () => this.opcionCards() )

  //@Output() mostrarCardsEmit = new EventEmitter<boolean>()
  mostrarCardsEmit = output<boolean>()

  filtrarBusquedaEmit = output<string>();
  idNuevoEmit = output<void>();

  router = inject(Router)

  textoBusqueda = ''

  buscar(){
    this.filtrarBusquedaEmit.emit( this.textoBusqueda )
  }

  buscarLimpiar(){
    this.textoBusqueda = ''
    this.filtrarBusquedaEmit.emit('')
  }

  mostrar(mostrar: boolean){
    this.mostrarCards.set( mostrar );
    this.mostrarCardsEmit.emit( mostrar );
  }

  idNuevo(){
    if( this.nuevaEntidadPagina() != ''){
      this.router.navigateByUrl( this.nuevaEntidadPagina() )
      return
    }

    this.idNuevoEmit.emit();
  }

}
