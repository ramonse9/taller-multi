import { GastoMovimiento } from '../../../interfaces/gasto-movimiento.interface';
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';

@Component({
  selector: 'app-card-gasto-movimiento',
  imports: [CommonModule, NgIcon, RouterLink, TextPreviewComponent ],
  templateUrl: './card-gasto-movimiento.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGastoMovimientoComponent {

  gasto = input.required<GastoMovimiento>()

  gastoLinked = linkedSignal( () => this.gasto() )

  //ordenesServices = Inject(OrdenesService)
  //router = Inject(Router)

  //@Output() ordenEstatusActualizadaEmit = new EventEmitter<Partial<Orden>>()

  //get EnumCategoria(){
  //  return EnumCategoria
  //}

  //get EnumEstatusOrdenFactura(){
  //  return EnumEstatusOrdenFactura
  //}

  //get nombreCompleto(){
    //return !this.cotizacion().cliente ? '' : this.cotizacion().cliente!.nombre + ' ' + this.cotizacion().cliente!.paterno + ' ' + this.cotizacion().cliente!.materno
  //}

  //get subtotalCotizacion(){
  //  return this.cotizacion().conceptos.reduce( (acumulador: number , concepto: CotizacionConcepto) => {
  //    return acumulador + ( concepto.cantidad * concepto.costoUnitario)
  //  }, 0)
  //}

}
