import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, tap } from 'rxjs';
import { Options } from '@shared/interfaces/options.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { OrdenNota } from '@operaciones/interfaces/orden-nota.interface';
import { Vehiculo } from '@catalogos/interfaces/vehiculo.interface';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { OrdenConcepto } from '@operaciones/interfaces/orden-concepto.interface';
import { OrdenesResponse } from '@operaciones/interfaces/orden.response';
import { UpdateOrdenEstatusDto } from '@operaciones/interfaces/update-orden-estatus.dto';
import { UpdateOrdenEstatusResponseDto } from '@operaciones/interfaces/update-orden-estatus-response.dto';
import { OrdenEstatusTotalResponse } from '@operaciones/interfaces/orden-estatus-total-response';
import { UpdateOrdenPagoDto } from '@operaciones/interfaces/update-orden-pago.dto';

const baseUrl = environment.baseUrl;

interface UpdateOrdenConceptosPayload {
  conceptos: OrdenConcepto[]
}

@Injectable({
  providedIn: 'root'
})
export class OrdenesService {

  private http = inject(HttpClient)

  //private _clienteSeleccionado = signal<Cliente | null>(null);
  private _empresaSeleccionado = signal<Empresa | null>(null);
  private _vehiculoSeleccionado = signal<Vehiculo | null>(null);
  private _descripcionSeleccionado = signal<string | null>(null);
  private _conceptosSeleccionado = signal<OrdenConcepto[] | null>(null);
  private _cotizacionIdSeleccionado = signal<string | null>(null);

  getOrdenes(options: Options):Observable<OrdenesResponse>{

    const { limit = 6, page = 1, filtro = ''} = options;

    return this.http.get<OrdenesResponse>(`${baseUrl}/ordenes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getOrden(id: string):Observable<Orden | null >{

    if( id === 'new'){
      //return of( emptyOrden )
      return of( null )
    }

    return this.http.get<Orden>(`${baseUrl}/ordenes/${id}`)
  }

  getOrdenesEstatusTotales():Observable<OrdenEstatusTotalResponse[]>{
    return this.http.get<OrdenEstatusTotalResponse[]>(`${baseUrl}/ordenes/totales`)
  }

  createOrden( ordenLike: Partial<Orden> ):Observable<{id:string}>{

    return this.http.post<{id: string}>(`${baseUrl}/ordenes`, ordenLike)

  }

  createOrdenNota( ordenNotaLike: Partial<OrdenNota> ): Observable<OrdenNota>{
    return this.http.post<OrdenNota>(`${baseUrl}/ordenes/notas`, ordenNotaLike)
  }

  createOrdenNotaWithImagenes( ordenNotaLike: Partial<OrdenNota>, files: File[] ): Observable<OrdenNota>{

    const formData = new FormData()

    Object.entries(ordenNotaLike).forEach( ([key,value]) => {
      if(value !== null && value !== undefined ){
        formData.append(key, value.toString())
      }
    })

    files?.forEach( file => {
      formData.append('files', file)
    })

    return this.http.post<OrdenNota>(`${baseUrl}/ordenes/notas`, formData)
  }

  updateOrden( id: string, ordenLike: Partial<Orden>):Observable<Orden>{

    return this.http.patch<Orden>(`${baseUrl}/ordenes/${id}`, ordenLike)

  }

  updateOrdenEstatus(id: string, updateOrdenEstatusDto: UpdateOrdenEstatusDto):Observable<UpdateOrdenEstatusResponseDto>{

    return this.http.patch<UpdateOrdenEstatusResponseDto>(`${baseUrl}/ordenes/estatus/${id}`, updateOrdenEstatusDto)

  }

  updateOrdenConceptos(id: string, conceptos: { id_producto_servicio: string, cantidad: number, costoUnitario: number}[]):Observable<Orden>{
    return this.http.patch<Orden>(`${baseUrl}/ordenes/${id}/conceptos`, conceptos)
  }

  updateOrdenPago(id: string, updateOrdenPagoDto: UpdateOrdenPagoDto):Observable<{id: string}>{

    return this.http.patch<{id: string}>(`${baseUrl}/ordenes/pagada/${id}`, updateOrdenPagoDto)

  }

  uploadImages( images?: FileList): Observable<string[]>{

    if(!images) return of([])

    const uploadObservables = Array.from(images).map( (imageFile) => this.uploadImage(imageFile) )

    return forkJoin(uploadObservables).pipe(
      tap((imageNames) => console.log(imageNames))
    )

  }

  uploadImage( imageFile: File ): Observable<string>{

    const formData = new FormData();
    formData.append('file', imageFile);

    return this.http
        .post<{fileName: string}>(`${baseUrl}/files/product`, formData)
        .pipe(map((resp) => resp.fileName))
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

  get descripcionSeleccionado(){
    return this._descripcionSeleccionado()
  }

  set descripcionSeleccionado( descripcion: string | null ){
    this._descripcionSeleccionado.set( descripcion )
  }

  get conceptosSeleccionado(){
    return this._conceptosSeleccionado()
  }

  set conceptosSeleccionado( conceptos: OrdenConcepto[] | null ){
    this._conceptosSeleccionado.set( conceptos )
  }

  get cotizacionIdSeleccionado(){
    return this._cotizacionIdSeleccionado()
  }

  set cotizacionIdSeleccionado( id: string | null ){
    this._cotizacionIdSeleccionado.set( id )
  }

}
