import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Options } from '../../shared/interfaces/options.interface';
import { ProveedoresResponse } from '@catalogos/interfaces/proveedor.response';
import { Proveedor } from '@catalogos/interfaces/proveedor.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private http = inject(HttpClient)

  getProveedores(options: Options ):Observable<ProveedoresResponse>{

    const { limit = 6, page = 1, filtro = ''  } = options;

    return this.http.get<ProveedoresResponse>(`${baseUrl}/proveedores`, {
      params: {
        limit: limit,
        paget: page,
        fSearch: filtro
      }
    })
      //.pipe(
      //  tap( resp => this.proveedoresCache.set(KeyboardEvent, resp))
      //)
  }

  getProveedoresAll():Observable<Partial<ProveedoresResponse>>{
    return this.http.get<Partial<ProveedoresResponse>>(`${baseUrl}/proveedores/all`)
  }

  getProveedor(id: string){

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Proveedor>(`${baseUrl}/proveedores/${id}`)
  }

  updateProveedor( id: string, proveedorLike: Partial<Proveedor>):Observable<Proveedor>{
    return this.http.patch<Proveedor>( `${baseUrl}/proveedores/${id}`, proveedorLike)
  }

  createProveedor( proveedorLike: Partial<Proveedor> ):Observable<Proveedor>{

    return this.http.post<Proveedor>(`${baseUrl}/proveedores`, proveedorLike)

  }

}
