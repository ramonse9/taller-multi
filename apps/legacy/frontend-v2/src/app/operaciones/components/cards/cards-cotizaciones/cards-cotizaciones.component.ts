import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { EnumBadgeSimpleColor, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { CardCotizacionComponent } from '../card-cotizacion/card-cotizacion.component';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';

@Component({
  selector: 'app-cards-cotizaciones',
  imports: [ CardCotizacionComponent, BadgeMessageComponent],
  templateUrl: './cards-cotizaciones.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsCotizacionesComponent {

  cotizaciones = input.required<Cotizacion[]>();

  cotizacionesListado = linkedSignal( () => this.cotizaciones() )

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

 }
