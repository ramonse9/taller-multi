//import { EnumEstatusCompra } from './../../../../shared/enums/general-estatus.enum';
//import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { EnumCategoria, EnumEstatusCompra } from '@shared/enums/general-estatus.enum';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { ToastService } from '@shared/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { ComprasService } from '@inventario/services/compras.service';
//import { EnumEstatusCompra } from '../enums/estatus-compra.enum';

@Component({
  selector: 'app-modal-compra-estatus-update',
  imports: [NgIcon, EstatusBadgeComponent],
  templateUrl: './modal-compra-estatus-update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalCompraEstatusUpdateComponent {
  //@Input() compra!: { id: string; estatus: EnumEstatusCompra };
  //@Input() idCompra !: { id: string; estatus: EnumEstatusCompra };
  //@Output() onUpdate = new EventEmitter<'confirmar' | 'cancelar'>();
  @Output() onCloseEmit = new EventEmitter<EnumEstatusCompra | void>();

  idCompra = input.required<string>();
  estatus = input.required<EnumEstatusCompra>();
  nuevoEstatus = input.required<EnumEstatusCompra>();

  comprasService = inject(ComprasService)
  toastService = inject(ToastService)

  get EnumEstatusCompra(){
    return EnumEstatusCompra
  }

  get EnumCategoria(){
    return EnumCategoria
  }

  //updateStatus(action: 'confirmar' | 'cancelar') {
    //this.onUpdate.emit(action);
  //}

  closeModal() {
    this.onCloseEmit.emit();
  }

  async onSubmit(nuevoEstatus: EnumEstatusCompra){

    try{

      if( nuevoEstatus === EnumEstatusCompra.CONFIRMADA){
        await firstValueFrom(
          this.comprasService.confirmarCompra( this.idCompra())
        )

        this.toastService.showToast( "Se confirmó correctamente la compra" )

      }

      if( nuevoEstatus === EnumEstatusCompra.CANCELADA ){

        await firstValueFrom(
          this.comprasService.cancelarCompra( this.idCompra())
        )

        this.toastService.showToast( "Se canceló correctamente la compra" )

      }

      this.onCloseEmit.emit(nuevoEstatus)


    }catch(error: any){

      this.toastService.showToastErrors( error )
      this.onCloseEmit.emit()

    }

  }

}
