import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GastosMovimientosResponse } from '../interfaces/gasto-movimiento.response';
import { GastoMovimiento } from '../interfaces/gasto-movimiento.interface';
import { Gasto } from '../interfaces/gasto.interface';
import { GastoCategoriaResponse } from '../interfaces/gasto-categoria.response';
import { GastoMovimientoCreate } from '@pagos/interfaces/gasto-movimiento-create.interface';
import { Grafica6Meses } from '@dashboard/interfaces/grafica-6-meses.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class GastosMovimientosService {

  private http = inject(HttpClient);


  /*
  getGastos( options: Options ):Observable<GastosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastosResponse>(`${baseUrl}/gastos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }*/

  getGastosMovimientos( options: Options ):Observable<GastosMovimientosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastosMovimientosResponse>(`${baseUrl}/gastos/movimientos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  /*
  getGastosConceptos( options: Options ):Observable<GastoConceptoResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastoConceptoResponse>(`${baseUrl}/gastos/conceptos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }*/

  getGastosConMovimientos( options: Options, mes: number, anio: number ):Observable<any>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<any>(`${baseUrl}/gastos/movimientos/por-mes`, {
      params: {
        //limit: limit,
        //page: page,
        fSearch: filtro,
        mes: mes,
        anio: anio
      }
    })

  }

  getGastosConMovimientos6Meses( ):Observable<Grafica6Meses[]>{

    return this.http.get<Grafica6Meses[]>(`${baseUrl}/gastos/conceptos/gastos6meses`, {
    })

  }

  /*
  getGastosCategorias( options: Options ):Observable<GastoCategoriaResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastoCategoriaResponse>(`${baseUrl}/gastos/categorias`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }*/

  /*
  getGasto( id: string ):Observable<Gasto | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Gasto>(`${baseUrl}/gastos/${id}`)

  }*/

  getGastoMovimiento( id: string ):Observable<GastoMovimiento | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<GastoMovimiento>(`${baseUrl}/gastos/movimientos/${id}`)

  }

  /*
  createGasto( gastoLike: Partial<Gasto> ): Observable<Gasto>{

    return this.http.post<Gasto>(`${baseUrl}/gastos`, gastoLike )

  }*/

  createGastoMovimiento( gastoMovimientoLike: Partial<GastoMovimientoCreate> ): Observable<GastoMovimiento>{

    return this.http.post<GastoMovimiento>( `${baseUrl}/gastos/movimientos`, gastoMovimientoLike )

  }

  /*
  updateGasto(id: string, gastoLike: Partial<Gasto>):Observable<Gasto>{

    return this.http.patch<Gasto>(`${baseUrl}/gastos/${id}`, gastoLike)

  }*/

  updateGastoMovimiento(id: string, gastoMovimientoLike: Partial<GastoMovimiento>):Observable<GastoMovimiento>{

    return this.http.patch<GastoMovimiento>(`${baseUrl}/gastos/movimientos/${id}`, gastoMovimientoLike)

  }

}
