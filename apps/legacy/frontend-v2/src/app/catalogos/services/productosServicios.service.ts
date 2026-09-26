import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ProductoServicio } from '../interfaces/producto-servicio.interface';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProductosServiciosResponse } from '@catalogos/interfaces/producto-servicio.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ProductosServiciosService {

  private http = inject(HttpClient);

  getProductosServicios( options: Options ):Observable<ProductosServiciosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<ProductosServiciosResponse>(`${baseUrl}/productosservicios`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getProductoServicio( id: string ):Observable<ProductoServicio | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<ProductoServicio>(`${baseUrl}/productosservicios/${id}`)

  }

  createProductoServicio( productoServicioLike: Partial<ProductoServicio> ): Observable<ProductoServicio>{

    return this.http.post<ProductoServicio>( `${baseUrl}/productosservicios`, productoServicioLike )

  }

  updateProductoServicio(id: string, productoServicioLike: Partial<ProductoServicio>):Observable<ProductoServicio>{

    return this.http.patch<ProductoServicio>(`${baseUrl}/productosservicios/${id}`, productoServicioLike)

  }

}
