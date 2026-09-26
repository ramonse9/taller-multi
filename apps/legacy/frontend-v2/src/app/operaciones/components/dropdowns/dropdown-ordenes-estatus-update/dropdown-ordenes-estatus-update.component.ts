import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth/services/auth.service';
import { NgIcon } from "@ng-icons/core";
import { EstatusBadgeComponent } from '@shared/components/estatus-badge/estatus-badge.component';
import { EstatusIndicatorComponent } from '@shared/components/estatus-indicator/estatus-indicator.component';
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { EstatusService } from '@shared/services/estatus.service';
import { OrdenesService } from '@operaciones/services/ordenes.service';
import { EnumCategoria, EnumEstatusOrden, EnumEstatusToast } from '@shared/enums/general-estatus.enum';
import { ToastService } from '@shared/services/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dropdown-ordenes-estatus-update',
  imports: [CommonModule, NgIcon, EstatusIndicatorComponent, EstatusBadgeComponent],
  templateUrl: './dropdown-ordenes-estatus-update.component.html'
})
export class DropdownOrdenesEstatusUpdateComponent {

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

  async onSubmit( estatus: string){

    if( estatus === this.orden().estatus){
      this.toastService.showToast("Necesitas modificar el estatus para poder actualizarlo.", EnumEstatusToast.WARNING);
      return;
    }

    try{

      const payload = { estatus: estatus as EnumEstatusOrden }

      const nuevaNota = await firstValueFrom(
        this.ordenesService.updateOrdenEstatus( this.orden().id, payload )
      )

      this.toastService.showToast( "Se actualizó correctamente el estatus" )
      //this.isVisible.set( false )
      this.hideDropDown()

      const ordenNota: OrdenNota = { ...nuevaNota, imagenes: [] }

      const nuevoEstatusNota: Partial<Orden> = {
        id: this.orden().id,
        estatus: estatus,
        notas: [ ordenNota ]
      }

      this.ordenEstatusActualizadaEmit.emit( nuevoEstatusNota )

    }catch(error: any){

      this.toastService.showToastErrors( error )

    }

  }


}
