
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { Factura } from '@facturas/interfaces/factura.interface';

@Component({
  selector: 'app-facturas-sin-liquidar-table',
  imports: [CommonModule ],
  templateUrl: './facturas-sin-liquidar-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacturasSinLiquidarTableComponent {

  facturas = input.required<Factura[]>();
  facturasParaLiquidar: string[] = []
  @Output() facturasParaLiquidarEmit = new EventEmitter<string[]>()

  onToggleLiquidar(event: Event, clave: string) {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    if( isChecked ){
      if( !this.facturasParaLiquidar.includes(clave) ){
        this.facturasParaLiquidar.push( clave );
      }
    }else{
      this.facturasParaLiquidar = this.facturasParaLiquidar.filter( f => f !== clave )
    }

    this.facturasParaLiquidarEmit.emit( this.facturasParaLiquidar );

  }

}
