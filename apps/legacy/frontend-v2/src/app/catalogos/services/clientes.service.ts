import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Options } from '@shared/interfaces/options.interface';
import { ClientesResponse } from '@catalogos/interfaces/cliente.response';
import { ClientesTotalResponse } from '@catalogos/interfaces/clientes-total.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private http = inject(HttpClient)

  getClientes(options: Options):Observable<ClientesResponse>{

    const { limit = 12, page = 0, filtro = '' } = options

    return this.http.get<ClientesResponse>(`${baseUrl}/clientes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getCliente(id: string):Observable<Cliente | null>{
    if( id === 'new'){
      return of(null)
      //return of(emptyCliente)
    }

    return this.http.get<Cliente>(`${baseUrl}/clientes/${id}`)
  }

  getClientesTotal():Observable<ClientesTotalResponse>{

    return this.http.get<ClientesTotalResponse>(`${baseUrl}/clientes/total`, {
    })

  }

  createCliente( clienteLike: Partial<Cliente> ):Observable<Cliente>{

    return this.http.post<Cliente>( `${baseUrl}/clientes`, clienteLike )

  }

  updateCliente(id: string, clienteLike: Partial<Cliente>):Observable<Cliente>{

    return this.http.patch<Cliente>(`${baseUrl}/clientes/${id}`, clienteLike)

  }

}
