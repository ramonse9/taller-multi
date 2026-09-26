import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Options } from '@shared/interfaces/options.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { Modelo } from '@catalogos/interfaces/modelo.interface';
import { Cotizacion } from '@operaciones/interfaces/cotizacion.interface';
import { CotizacionesResponse } from '@operaciones/interfaces/cotizacion.response';

const baseUrl = environment.baseUrl;

//interface UpdateCotizacionConceptosPayload {
//  conceptos: CotizacionConcepto[]
//}

@Injectable({
  providedIn: 'root'
})
export class CotizacionesService {

  private http = inject(HttpClient)

  private _clienteSeleccionado = signal<Cliente | null>(null);
  private _empresaSeleccionado = signal<Empresa | null>(null);
  private _vehiculoSeleccionado = signal<Vehiculo | null>(null);
  private _modeloSeleccionado = signal<Modelo | null>(null);

  getCotizaciones(options: Options):Observable<CotizacionesResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<CotizacionesResponse>(`${baseUrl}/cotizaciones`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getCotizacion(id: string):Observable<Cotizacion | null>{

    if( id === 'new'){
      return of( null )
    }

    return this.http.get<Cotizacion>(`${baseUrl}/cotizaciones/${id}`)
  }

  createCotizacion( cotizacionLike: Partial<Cotizacion> ):Observable<Cotizacion>{

    return this.http.post<Cotizacion>(`${baseUrl}/cotizaciones`, cotizacionLike)

  }

  updateCotizacion( id: string, cotizacionLike: Partial<Cotizacion>):Observable<Cotizacion>{

    return this.http.patch<Cotizacion>(`${baseUrl}/cotizaciones/${id}`, cotizacionLike)

  }

  updateCotizacionConceptos(id: string, conceptos: { id_producto_servicio: string, cantidad: number, costoUnitario: number}[]):Observable<Cotizacion>{
    return this.http.patch<Cotizacion>(`${baseUrl}/cotizaciones/${id}/conceptos`, conceptos)
  }

  get clienteSeleccionado(){
    return this._clienteSeleccionado()
  }

  set clienteSeleccionado( cliente: Cliente | null ){
    this._clienteSeleccionado.set( cliente )
  }

  get empresaSeleccionado(){
    return this._empresaSeleccionado()
  }

  set empresaSeleccionado( empresa: Empresa | null ){
    this._empresaSeleccionado.set( empresa )
  }

  get vehiculoSeleccionado(){
    return this._vehiculoSeleccionado()
  }

  set vehiculoSeleccionado( vehiculo: Vehiculo | null ){
    this._vehiculoSeleccionado.set( vehiculo )
  }

  get modeloSeleccionado(){
    return this._modeloSeleccionado()
  }

  set modeloSeleccionado( modelo: Modelo | null ){
    this._modeloSeleccionado.set( modelo )
  }

}
