import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { SatProductoServicio } from '@facturas/interfaces/sat-producto-servicio.interface';
import { BadgeSimple } from '@shared/components/badges/badge-simple/badge-simple';
import { EnumBadgeSimpleColor } from '@shared/enums/general-estatus.enum';

@Component({
  selector: 'app-sat-productos-servicios-table',
  imports: [CommonModule, BadgeSimple],
  templateUrl: './sat-productos-servicios-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SatProductosServiciosTableComponent {

  satProductosServicios = input.required<SatProductoServicio[]>();
  @Output() satProductoServicioSelected = new EventEmitter<SatProductoServicio>();

  selectSatProductoServicio( satProductoServicio: SatProductoServicio ){

    this.satProductoServicioSelected.emit( satProductoServicio );

  }

  calcularBadgeSimpleColor( tipoProductoServicio: string ): EnumBadgeSimpleColor{
    if( tipoProductoServicio === 'servicio' ){
      return EnumBadgeSimpleColor.YELLOW;
    }

    return EnumBadgeSimpleColor.GREEN;

  }

 }
