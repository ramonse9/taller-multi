import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Marca } from '../interfaces/marca.interface';
import { Options } from '../../shared/interfaces/options.interface';
import { MarcasResponse } from '@catalogos/interfaces/marca.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class MarcasService {

  private http = inject(HttpClient)

  getMarcas(options: Options ):Observable<MarcasResponse>{

    const { limit = 6, page = 1, filtro = ''  } = options;

    return this.http.get<MarcasResponse>(`${baseUrl}/marcas`, {
      params: {
        limit: limit,
        paget: page,
        fSearch: filtro
      }
    })
      //.pipe(
      //  tap( resp => this.marcasCache.set(KeyboardEvent, resp))
      //)
  }

  getMarcasAll():Observable<Partial<MarcasResponse>>{
    return this.http.get<Partial<MarcasResponse>>(`${baseUrl}/marcas/all`)
  }

  getMarca(id: string){

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Marca>(`${baseUrl}/marcas/${id}`)
  }

  updateMarca( id: string, marcaLike: Partial<Marca>):Observable<Marca>{
    return this.http.patch<Marca>( `${baseUrl}/marcas/${id}`, marcaLike)
  }

  createMarca( marcaLike: Partial<Marca> ):Observable<Marca>{

    return this.http.post<Marca>(`${baseUrl}/marcas`, marcaLike)

  }

}
