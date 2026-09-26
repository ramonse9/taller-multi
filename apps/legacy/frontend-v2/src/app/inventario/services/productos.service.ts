import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProductosResponse } from '@inventario/interfaces/producto.response';
import { Producto } from '@inventario/interfaces/producto.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);

  getProductos( options: Options ):Observable<ProductosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<ProductosResponse>(`${baseUrl}/productos`, {
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
