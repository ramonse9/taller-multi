
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { Options } from '@shared/interfaces/options.interface';
import { EmpresasResponse } from '@catalogos/interfaces/empresa.response';
import { EmpresasTotalResponse } from '@catalogos/interfaces/empresas-total.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {

  private http = inject(HttpClient)

  getEmpresas(options: Options):Observable<EmpresasResponse>{

    const { limit = 12, page = 0, filtro = '' } = options

    return this.http.get<EmpresasResponse>(`${baseUrl}/empresas`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getEmpresa(id: string):Observable<Empresa | null >{
    if( id === 'new'){
      return of( null )
      //return of(emptyEmpresa)
    }

    return this.http.get<Empresa>(`${baseUrl}/empresas/${id}`)
  }

  getEmpresasTotal():Observable<EmpresasTotalResponse>{

    return this.http.get<EmpresasTotalResponse>(`${baseUrl}/empresas/total`, {
    })

  }

  createEmpresa( empresaLike: Partial<Empresa> ):Observable<Empresa>{

    return this.http.post<Empresa>( `${baseUrl}/empresas`, empresaLike )

  }

  updateEmpresa(id: string, empresaLike: Partial<Empresa>):Observable<Empresa>{

    return this.http.patch<Empresa>(`${baseUrl}/empresas/${id}`, empresaLike)

  }

}
