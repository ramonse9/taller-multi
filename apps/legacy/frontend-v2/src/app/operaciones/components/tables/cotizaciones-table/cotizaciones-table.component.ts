import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardEmpresaComponent } from '@catalogos/components/cards/card-empresa/card-empresa.component';
import { CardVehiculoComponent } from '@catalogos/components/cards/card-vehiculo/card-vehiculo.component';
import { TextPreviewComponent } from '@shared/components/text-preview/text-preview.component';
import { EnumBadgeSimpleColor, EnumCategoria, EnumCeroRegistros } from '@shared/enums/general-estatus.enum';
import { NgIcon } from '@ng-icons/core';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { BadgeMessageComponent } from '@shared/components/badges/badge-message/badge-message.component';
import { CardClienteComponent } from '@catalogos/components/cards/card-cliente/card-cliente.component';

@Component({
  selector: 'app-cotizaciones-table',
  imports: [CommonModule, NgIcon, RouterLink, CardClienteComponent, CardVehiculoComponent, TextPreviewComponent, CardEmpresaComponent, BadgeMessageComponent],
  templateUrl: './cotizaciones-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CotizacionesTableComponent {

  cotizaciones = input.required<Cotizacion[]>();

  cotizacionesListado = linkedSignal( () => this.cotizaciones() )

  get EnumCategoria(){
    return EnumCategoria;
  }

  get EnumBadgeSimpleColor(){
    return EnumBadgeSimpleColor;
  }

  get EnumCeroRegistros(){
    return EnumCeroRegistros;
  }

 }
