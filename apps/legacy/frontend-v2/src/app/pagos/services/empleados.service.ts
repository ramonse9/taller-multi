import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Options } from '@shared/interfaces/options.interface';
import { EmpleadosResponse } from '../interfaces/empleado.response';
import { Grafica6Meses } from '@dashboard/interfaces/grafica-6-meses.interface';
import { CreateEmpleado } from '@pagos/interfaces/create-empleado.interface';
import { Empleado } from '@pagos/interfaces/empleado.interface';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

  private http = inject(HttpClient);

  getEmpleados( options: Options ):Observable<EmpleadosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<EmpleadosResponse>(`${baseUrl}/empleados`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getEmpleado( id: string ):Observable<Empleado | null>{

    if( id === 'new'){
      return of(null)
    }

    return this.http.get<Empleado>(`${baseUrl}/empleados/${id}`)

  }

  createEmpleado( createEmpleadoLike: Partial<CreateEmpleado> ): Observable<Empleado>{
    return this.http.post<Empleado>( `${baseUrl}/empleados`, createEmpleadoLike )
  }

  updateEmpleado(id: string, empleadoLike: Partial<Empleado>):Observable<Empleado>{

    return this.http.patch<Empleado>(`${baseUrl}/empleados/${id}`, empleadoLike)

  }

}
