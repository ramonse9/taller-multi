import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponentDescriptionComponent } from '../../../../catalogos/components/cards/card-component-description/card-component-description.component';
import { PageButtonDetallesComponent } from '@shared/components/forms/page-button-detalles/page-button-detalles.component';
import { EnumCategoria, EnumEstatusCompra, EnumLinks } from '@shared/enums/general-estatus.enum';
import { EstatusIndicatorComponent } from '@shared/components/estatus-indicator/estatus-indicator.component';
import { EstatusBadgeComponent } from "@shared/components/estatus-badge/estatus-badge.component";
import { CompraDetalleLite, CompraLite } from '@inventario/interfaces/compra.interface';
import { BadgeCodigoBarrasComponent } from "@shared/components/badges/badge-codigo-barras/badge-codigo-barras";
import { NgIcon } from "@ng-icons/core";
import { ModalCompraEstatusUpdateComponent } from "@inventario/components/modals/modal-compra-estatus-update/modal-compra-estatus-update.component";
import { AuthService } from '@auth/services/auth.service';

@Component({
  selector: 'app-card-compra-detalle',
  imports: [CommonModule, CardComponentDescriptionComponent, PageButtonDetallesComponent, EstatusIndicatorComponent, EstatusBadgeComponent, BadgeCodigoBarrasComponent, NgIcon, ModalCompraEstatusUpdateComponent],
  templateUrl: './card-compra-detalle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardCompraDetalleComponent {

  compra = input.required<CompraLite>()

  compraLinked = linkedSignal( () => this.compra() )

  authService = inject(AuthService);


  modalOpen = signal(false);
  nuevoEstatus = signal<EnumEstatusCompra>(EnumEstatusCompra.CONFIRMADA);

  get totalCompra(){
    return this.compra().detalles.reduce( (acumulador: number , concepto: CompraDetalleLite) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get EnumLinks(){
    return EnumLinks;
  }

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumEstatusCompra(){
    return EnumEstatusCompra;
  }

  get subtotalCotizacion(){
    return this.compra().detalles.reduce( (acumulador: number , concepto: CompraDetalleLite) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  onCancelarCompra(){
    this.nuevoEstatus.set( EnumEstatusCompra.CANCELADA );
    this.modalOpen.set(true);
  }

  onConfirmarCompra(){
    this.nuevoEstatus.set( EnumEstatusCompra.CONFIRMADA );
    this.modalOpen.set(true);

  }

  cerrarModal( nuevoEstatus?: EnumEstatusCompra | void){
    if( nuevoEstatus ){

      let usuarioCancelacion = ''
      let fechaCancelacion: Date | null = null;
      let usuarioConfirmacion = ''
      let fechaConfirmacion: Date | null = null;

      if( nuevoEstatus === EnumEstatusCompra.CONFIRMADA ){

        usuarioConfirmacion = this.authService.user()!.fullName,
        fechaConfirmacion = new Date()

      }

      this.compraLinked.update( compra => ({
        ...compra,
        estatus: nuevoEstatus,

      }))


    }

    this.modalOpen.set(false);

  }


}
