import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { CotizacionConcepto } from '@operaciones/interfaces/cotizacion-concepto.interface';
import { CardComponentDescriptionComponent } from '../../../../catalogos/components/cards/card-component-description/card-component-description.component';
import { PageButtonDetallesComponent } from '@shared/components/forms/page-button-detalles/page-button-detalles.component';
import { EnumLinks } from '@shared/enums/general-estatus.enum';
import { CardComponentClienteEmpresaComponent } from '../../../../catalogos/components/cards/card-component-cliente-empresa/card-component-cliente-empresa.component';
import { CardComponentVehiculoComponent } from '../../../../catalogos/components/cards/card-component-vehiculo/card-component-vehiculo.component';

@Component({
  selector: 'app-card-cotizacion',
  imports: [CommonModule, NgIcon, CardComponentDescriptionComponent, PageButtonDetallesComponent, CardComponentClienteEmpresaComponent, CardComponentVehiculoComponent ],
  templateUrl: './card-cotizacion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardCotizacionComponent {

  cotizacion = input.required<Cotizacion>()

  cotizacionLinked = linkedSignal( () => this.cotizacion() )

  get nombreCompleto(){
    return !this.cotizacion().cliente ? '' : this.cotizacion().cliente!.nombre
  }

  get subtotalCotizacion(){
    return this.cotizacion().conceptos.reduce( (acumulador: number , concepto: CotizacionConcepto) => {
      return acumulador + ( concepto.cantidad * concepto.costoUnitario)
    }, 0)
  }

  get EnumLinks(){
    return EnumLinks;
  }

  get bgColor(){
    return this.cotizacion().orden ? 'bg-blue-900/20 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-900/20 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  }

}
