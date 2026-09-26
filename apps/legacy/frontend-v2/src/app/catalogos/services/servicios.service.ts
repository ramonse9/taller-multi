import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ServiciosResponse } from '@catalogos/interfaces/servicio.response';
import { Servicio } from '@catalogos/interfaces/servicio.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {

  private http = inject(HttpClient);

  getServicios( options: Options ):Observable<ServiciosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<ServiciosResponse>(`${baseUrl}/servicios`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getServicio( id: string ):Observable<Servicio | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Servicio>(`${baseUrl}/servicios/${id}`)

  }

  createServicio( servicioLike: Partial<Servicio> ): Observable<Servicio>{

    return this.http.post<Servicio>( `${baseUrl}/servicios`, servicioLike )

  }

  updateServicio(id: string, servicioLike: Partial<Servicio>):Observable<Servicio>{

    return this.http.patch<Servicio>(`${baseUrl}/servicios/${id}`, servicioLike)

  }

}
