import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FacturasService } from '@facturas/services/facturas.service';
import { catchError, Observable, of } from 'rxjs';
import { EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { SpinnerComponent } from '@shared/components/loading/spinner/spinner.component';

export interface Importes{
  subtotal: number
  ivaTrasladado: number
  isrRetenido: number
  ivaRetenido: number
  total: number
}

@Component({
  selector: 'app-impuestos-read-only-table',
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './impuestos-read-only-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpuestosReadOnlyTableComponent {

  conceptos = input.required<any>()

  receptorSatTipoPersona = input.required<EnumSatTipoPersona>()

  facturasService = inject(FacturasService);

  conceptosComputed = computed( () => this.conceptos().map( (c:any )=>({
    cantidad: c.cantidad,
    costoUnitario: c.costoUnitario,
    id_producto_servicio: c.idProductoServicio
    //id_producto_servicio: c.productoServicio.id
  }) ))

  importes = rxResource({
    params: () => ({
      receptorSatTipoPersona: this.receptorSatTipoPersona(),
      conceptos: this.conceptosComputed()
    }),
    stream: ({ params }):Observable<Importes> => {

      return this.facturasService.calcularImpuestos(
        params.receptorSatTipoPersona,
        this.conceptosComputed()
      ).pipe(
        catchError( error => {

          return of({
            subtotal: 0,
            ivaTrasladado: 0,
            isrRetenido: 0,
            ivaRetenido: 0,
            total: 0
          })
        })
      )
    }
  });

}
