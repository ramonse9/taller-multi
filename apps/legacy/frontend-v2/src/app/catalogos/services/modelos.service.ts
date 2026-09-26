import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Modelo } from '../interfaces/modelo.interface';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Options } from '../../shared/interfaces/options.interface';
import { ModelosResponse } from '@catalogos/interfaces/modelo.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ModelosService {

  private http = inject(HttpClient)

  getModelos(options: Options ):Observable<ModelosResponse>{

    const { limit = 6, page = 1, filtro = ''  } = options;

    return this.http.get<ModelosResponse>(`${baseUrl}/modelos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro.toLowerCase()
      }
    })
      //.pipe(
      //  tap( resp => this.marcasCache.set(KeyboardEvent, resp))
      //)
  }

  getModelosAll(options: Options ):Observable<ModelosResponse>{

    const { limit = 6, page = 1  } = options;

    return this.http.get<ModelosResponse>(`${baseUrl}/modelos`, {
      params: {
        limit: limit,
        page: page
      }
    })
      //.pipe(
      //  tap( resp => this.marcasCache.set(KeyboardEvent, resp))
      //)
  }

  getModelo(id: string):Observable<Modelo | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Modelo>(`${baseUrl}/modelos/${id}`)
  }

  createModelo( modeloLike: Partial<Modelo> ):Observable<Modelo>{

    return this.http.post<Modelo>(`${baseUrl}/modelos`, modeloLike)

  }

  updateModelo( id: string, modeloLike: Partial<Modelo>):Observable<Modelo>{

    return this.http.patch<Modelo>(`${baseUrl}/modelos/${id}`, modeloLike)

  }



}
