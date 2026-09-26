import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Compania } from '@catalogos/interfaces/compania.interface';
import { CompaniasResponse } from '@catalogos/interfaces/compania.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class CompaniasService {

  private http = inject(HttpClient)

  getClientes(options: Options):Observable<CompaniasResponse>{

    const { limit = 12, page = 0, filtro = '' } = options

    return this.http.get<CompaniasResponse>(`${baseUrl}/clientes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getCompania(id: string):Observable<Compania>{

    return this.http.get<Compania>(`${baseUrl}/companias/${id}`)
  }

}
