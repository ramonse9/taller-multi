import { AsyncPipe } from '@angular/common';
import { Component, inject, input, OnDestroy } from '@angular/core';
import { SpinnerService } from '@shared/services/spinner.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-button-submit',
  imports: [ AsyncPipe],
  templateUrl: './page-button-submit.component.html',
})
export class PageButtonSubmitComponent {

  id = input.required<string>();
  guardar = input<string>('Guardar');
  actualizar = input<string>('Actualizar');
  emitir = input<boolean>(false);

  spinnerService = inject(SpinnerService);
  //isLoading = false
  isLoading = this.spinnerService.isLoading$
  //private subscription: Subscription;

  //constructor(){
  //  this.subscription = this.spinnerService.isLoading$.subscribe( val => this.isLoading = val );
  //}

  //ngOnDestroy(): void {
  //  this.subscription.unsubscribe();
  //}

  get labelButton(){
    return ''
    
    /*if( this.emitir() ) {
      if( this.isLoading ) return 'Emitiendo...'
      return 'Emitir'
    }

    if( this.id() === 'new'){
      if( this.isLoading == true ) return 'Guardando...'
      return 'Guardar'

    }else{
      if( this.isLoading ) return 'Actualizando...'
      return 'Actualizar'
    }*/
  }
}
