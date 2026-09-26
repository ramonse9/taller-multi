import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { Options } from '@shared/interfaces/options.interface';
import { VehiculosResponse } from '@catalogos/interfaces/vehiculo.response';
import { VehiculosTotalResponse } from '@catalogos/interfaces/vehiculos-total.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class VehiculosService {

  private http = inject( HttpClient )

  getVehiculos( options: Options ):Observable<VehiculosResponse>{

    const { limit= 12, page = 1, filtro = '' } = options

    return this.http.get<VehiculosResponse>(`${baseUrl}/vehiculos`,{
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getVehiculo(id: string): Observable<Vehiculo | null>{

    if( id === 'new'){
      //return of(emptyVehiculo)
      return of(null)
    }

    return this.http.get<Vehiculo>(`${baseUrl}/vehiculos/${id}`)

  }

  getVehiculosTotal():Observable<VehiculosTotalResponse>{

    return this.http.get<VehiculosTotalResponse>(`${baseUrl}/vehiculos/total`, {
    })

  }

  createVehiculo(vehiculoLike: Partial<Vehiculo>):Observable<Vehiculo>{

    return this.http.post<Vehiculo>(`${baseUrl}/vehiculos`, vehiculoLike)

  }

  updateVehiculo(id: string, vehiculoLike: Partial<Vehiculo>):Observable<Vehiculo>{

    return this.http.patch<Vehiculo>(`${ baseUrl }/vehiculos/${id}`, vehiculoLike)

  }

}
