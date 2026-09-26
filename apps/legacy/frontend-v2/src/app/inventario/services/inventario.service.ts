import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProductosResponse } from '@inventario/interfaces/producto.response';
import { Producto } from '@inventario/interfaces/producto.interface';
import { InventarioMovimientosResponse } from '@inventario/interfaces/inventario-movimiento.response';
import { InventarioLotesResponse } from '@inventario/interfaces/inventario-lote.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private http = inject(HttpClient);

  getInventarioMovimientos( options: Options ):Observable<InventarioMovimientosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<InventarioMovimientosResponse>(`${baseUrl}/inventario/movimientos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getLotes( options: Options ):Observable<InventarioLotesResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<InventarioLotesResponse>(`${baseUrl}/inventario/lotes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getProducto( id: string ):Observable<Producto | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Producto>(`${baseUrl}/productos/${id}`)

  }

  createProducto( productoLike: Partial<Producto> ): Observable<Producto>{

    return this.http.post<Producto>( `${baseUrl}/productos`, productoLike )

  }

  updateProducto(id: string, productoLike: Partial<Producto>):Observable<Producto>{

    return this.http.patch<Producto>(`${baseUrl}/productos/${id}`, productoLike)

  }

}
