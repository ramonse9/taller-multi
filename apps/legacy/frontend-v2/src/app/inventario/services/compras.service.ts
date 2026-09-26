import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Options } from '@shared/interfaces/options.interface';
import { ComprasResponse } from '@inventario/interfaces/compra.response';
import { Compra, CompraLite } from '@inventario/interfaces/compra.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ComprasService {

  private http = inject(HttpClient)

  getCompras(options: Options, estatus: string[]):Observable<ComprasResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<ComprasResponse>(`${baseUrl}/compras`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro,
        estatus: estatus.join(',')
      }
    })

  }

  getCompra(id: string):Observable<CompraLite | null>{

    if( id === 'new'){
      return of( null )
    }

    return this.http.get<CompraLite>(`${baseUrl}/compras/${id}`)
  }

  createCompra( compraLike: Partial<Compra> ):Observable<Compra>{

    return this.http.post<Compra>(`${baseUrl}/compras`, compraLike)

  }

  confirmarCompra( id: string ):Observable<Compra>{

    return this.http.post<Compra>(`${baseUrl}/compras/${id}/confirmar`, {})

  }

  cancelarCompra( id: string ):Observable<Compra>{

    return this.http.post<Compra>(`${baseUrl}/compras/${id}/cancelar`, {})

  }

  updateCompra( id: string, compraLike: Partial<Compra>):Observable<Compra>{

    return this.http.patch<Compra>(`${baseUrl}/compras/${id}`, compraLike)

  }

  updateCompraDetalles(id: string, detalles: { id_producto: string, cantidad: number, costoUnitario: number}[]):Observable<Compra>{
    return this.http.patch<Compra>(`${baseUrl}/compras/${id}/detalles`, detalles)
  }

}
