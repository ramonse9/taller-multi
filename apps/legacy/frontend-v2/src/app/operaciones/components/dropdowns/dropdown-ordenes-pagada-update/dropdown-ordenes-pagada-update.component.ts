import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NgIcon } from "@ng-icons/core";
import { Orden } from '@operaciones/interfaces/orden.interface';
import { EstatusService } from '@shared/services/estatus.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { EnumCategoria, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dropdown-ordenes-pagada-update',
  imports: [CommonModule, NgIcon],
  templateUrl: './dropdown-ordenes-pagada-update.component.html'
})
export class DropdownOrdenesPagadaUpdateComponent {

  orden = input.required<Orden>();

  @Output() ordenEstatusActualizadaEmit = new EventEmitter<Partial<Orden>>()

  isDropdownVisible = signal(false)
  authService = inject(AuthService)
  toastService = inject(ToastService)
  router = inject(Router)
  ordenesService = inject(OrdenesService);

  private estatusService = inject(EstatusService)

  get EnumCategoria(){
    return EnumCategoria
  }

  get estatusList(){
    return this.estatusService.getEstatusByCategoria( EnumCategoria.ORDENES ) || []
  }

  showDropdown(){

    this.isDropdownVisible.set( true )

  }

  hideDropDown(){
    setTimeout( () => {
      this.isDropdownVisible.set( false )
    }, 100)
  }

  async pagar(){
    if( this.orden().pagada ){
      this.onSubmit( false, null )
    }else{
      this.onSubmit( true, new Date().toISOString() )
    }

  }

  async onSubmit( pagada: boolean, fechaPago: string | null){

    if( pagada === this.orden().pagada){
      this.toastService.showToast("Necesitas modificar el pago para poder actualizarlo.", EnumEstatusToast.WARNING);
      return;
    }

    try{

      //let fechaPago: string | null = null

      //if(pagada){
      //  fechaPago = new Date().toISOString()
      //}

      const payload = { pagada: pagada, fechaPago: fechaPago }

      const pagoActualizado = await firstValueFrom(
        this.ordenesService.updateOrdenPago( this.orden().id, payload )
      )

      this.toastService.showToast( "Se actualizó correctamente el pago" )
      //this.isVisible.set( false )
      this.hideDropDown()

      /*const ordenNota: OrdenNota = { ...nuevaNota, imagenes: [] }

      const nuevoEstatusNota: Partial<Orden> = {
        id: this.orden().id,
        estatus: estatus,
        notas: [ ordenNota ]
      }*/

      this.ordenEstatusActualizadaEmit.emit( payload )

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }


}
