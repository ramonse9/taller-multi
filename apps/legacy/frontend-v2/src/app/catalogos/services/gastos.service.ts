import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GastoCategoriaResponse } from '@pagos/interfaces/gasto-categoria.response';
import { GastoResponse } from '@pagos/interfaces/gasto.response';
import { Gasto } from '@pagos/interfaces/gasto.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class GastosService {

  private http = inject(HttpClient);

  getGastos( options: Options ):Observable<GastoResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastoResponse>(`${baseUrl}/gastos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getGastosCategorias( options: Options ):Observable<GastoCategoriaResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<GastoCategoriaResponse>(`${baseUrl}/gastos/categorias`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getGasto( id: string ):Observable<Gasto | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Gasto>(`${baseUrl}/gastos/${id}`)

  }

  createGasto( gastoLike: Partial<Gasto> ): Observable<Gasto>{

    return this.http.post<Gasto>(`${baseUrl}/gastos`, gastoLike )

  }

  updateGasto(id: string, gastoLike: Partial<Gasto>):Observable<Gasto>{

    return this.http.patch<Gasto>(`${baseUrl}/gastos/${id}`, gastoLike)

  }

}
