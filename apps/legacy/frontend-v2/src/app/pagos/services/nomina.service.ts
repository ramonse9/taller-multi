import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PeriodoMovimientosResponse } from '../interfaces/periodo-movimientos-response.interface';
import { PeriodosMovimientosTotalesResponse } from '../interfaces/periodos-movimientos-totales-response.interface';
import { CreateNominaMovimiento } from '../interfaces/create-nomina-movimiento.interface';
import { PeriodosMovimientosResponse } from '../interfaces/periodos-movimientos-response.interface';

import { Grafica6Meses } from '@dashboard/interfaces/grafica-6-meses.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class NominaService {

  private http = inject(HttpClient);

  getNominaMovimientos6Meses():Observable<Grafica6Meses[]>{

    return this.http.get<Grafica6Meses[]>(`${baseUrl}/nomina/movimientos/nomina6meses`, {

    })

  }

  getNominaPeriodosMovimientosTotales( mes: number, anio: number ):Observable<PeriodosMovimientosTotalesResponse>{

    return this.http.get<PeriodosMovimientosTotalesResponse>(`${baseUrl}/nomina/periodos`, {
      params: {
        mes: mes,
        anio: anio,
      }
    })

  }

  getNominaPeriodoMovimientos( idPeriodo: number ):Observable<PeriodoMovimientosResponse>{

    return this.http.get<PeriodoMovimientosResponse>(`${baseUrl}/nomina/periodo/movimientos`, {
      params: {
        id_periodo: idPeriodo
      }
    })

  }

  getNominaPeriodosMovimientos( idsPeriodos: number[] ):Observable<PeriodosMovimientosResponse>{

    return this.http.get<PeriodosMovimientosResponse>(`${baseUrl}/nomina/periodos/movimientos`, {
      params: {
        ids_periodos: idsPeriodos
      }
    })

  }

  createNominaMovimiento( createNominaMovimiento: CreateNominaMovimiento  ):Observable<{id: number}>{
    return this.http.post<{id:number}>(`${baseUrl}/nomina/movimientos`, createNominaMovimiento )
  }

}
