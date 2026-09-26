import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Emisor } from '@facturas/interfaces/emisor.interface';
import { Factura } from '@facturas/interfaces/factura.interface';
import { Cliente } from '@catalogos/interfaces/cliente.interface';
import { Empresa } from '@catalogos/interfaces/empresa.interface';
import { Options } from '@shared/interfaces/options.interface';
import { Observable, of } from 'rxjs';
import { environment } from '@env/environment';
import { SatProductoServicio } from '../interfaces/sat-producto-servicio.interface';
import { SatUsoCFDI } from '@facturas/interfaces/sat-uso-cfdi.interface';
import { SatRegimenFiscal } from '@facturas/interfaces/sat-regimen-fiscal.interface';
import { SatTipoComprobante } from '@facturas/interfaces/sat-tipo-comprobante.interface';
import { SatTipoPersona } from '@facturas/interfaces/sat-tipo-persona.interface';
import { OrdenConcepto } from '@operaciones/interfaces/orden-concepto.interface';
import { Importes } from '@facturas/components/tables/impuestos-read-only-table/impuestos-read-only-table.component';
import { SatFormaPago } from '@facturas/interfaces/sat-forma-pago.interface';
import { SatMetodoPago } from '@facturas/interfaces/sat-metodo-pago.interface';
import { Orden } from '@operaciones/interfaces/orden.interface';
import { SatExportacion } from '@facturas/interfaces/sat-exportacion.interface';
import { EnumSatCancelacionMotivo, EnumSatFormaPago, EnumSatMetodoPago, EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { Pago } from '../interfaces/pago.interface';
import { FacturasResponse } from '@facturas/interfaces/factura.response';
import { ProductoServicio } from '@catalogos/interfaces/producto-servicio.interface';

export interface CreateCancelacionDto{
  claveSatCancelacionMotivo: EnumSatCancelacionMotivo;
  id_factura:           string;
  uuid_factura:         string
  claveSatMetodoPago?:  EnumSatMetodoPago
  fechaEmision:        string | null;
  claveSatFormaPago?:   EnumSatFormaPago;
  condicionesPago?:     string;
  lugarExpedicion?:     string;
  observaciones?:       string;
  conceptos?:           ConceptoDto[];
}

export interface ConceptoDto{
  cantidad: number;
  costoUnitario: string;
  id_producto_servicio: string;
}

const baseUrl = environment.baseUrl;

const emptyFactura: Factura = {
  id: 'new',
  estatus: '',
  fechaEmision: new Date(),
  orden: {} as Orden,
  serie: '',
  folio: 0,
  satFormaPago: {} as SatFormaPago,
  condicionesPago: '',
  satMetodoPago: {} as SatMetodoPago,
  uuid: '',
  moneda: '',
  lugarExpedicion: '',
  observaciones: '',
  satTipoComprobante: {} as SatTipoComprobante,
  subtotal: 0,
  total: 0,
  satExportacion: {} as SatExportacion,
  emisor: {} as Emisor,
  receptor: {} as Cliente,
  emisorRFC: '',
  emisorRazonSocial: '',
  emisorSatUsoCFDI: {} as SatUsoCFDI,
  emisorSatRegimenFiscal: {} as SatRegimenFiscal,
  emisorCodigoPostal: '',
  receptorSatTipoPersona: {} as SatTipoPersona,
  receptorRFC: '',
  receptorRazonSocial: '',
  receptorEmail: '',
  receptorSatRegimenFiscal: {} as SatRegimenFiscal,
  receptorSatUsoCFDI: {} as SatUsoCFDI,
  receptorCodigoPostal: '',
  pagos: [],
  conceptos: []
}

const emptyProductoServicio: ProductoServicio = {
  id: 'new',
  descripcion: '',
  costoUnitario: 0 ,
  satProductoServicio: { } as SatProductoServicio
}

@Injectable({
  providedIn: 'root'
})
export class FacturasService {

  private http = inject(HttpClient);

  private _clienteSeleccionado = signal<Cliente | null>(null);
  private _empresaSeleccionado = signal<Empresa | null>(null);

  getFacturas( options: Options ):Observable<FacturasResponse>{

    const { limit = 10, page = 1, filtro = ''} = options;

    return this.http.get<FacturasResponse>(`${baseUrl}/facturas`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getFacturasSinLiquidar( receptorRFC: string ):Observable<FacturasResponse[]>{

    return this.http.get<FacturasResponse[]>(`${baseUrl}/facturas/sinliquidar/${receptorRFC}` );

  }

  getFactura(id: string | number):Observable<Factura>{

    if( id === 'new' ){
      return of( emptyFactura )
    }

    return this.http.get<Factura>(`${baseUrl}/facturas/${id}`)

  }

  getFacturaMinimal(id: string | number):Observable<Factura>{

    if( id === 'new' ){
      return of( emptyFactura )
    }

    return this.http.get<Factura>(`${baseUrl}/facturas/minimal/${id}`)

  }

  getPagos(id: string){
    return this.http.get(`${baseUrl}/facturas/${id}/pagos`)
  }

  createFactura( facturaLike: Partial<any>):Observable<Factura>{

    return this.http.post<Factura>(`${baseUrl}/facturas`, facturaLike)

  }

  createComplemento( complementoLike: Partial<any>):Observable<Pago>{

    return this.http.post<Pago>(`${baseUrl}/facturas/complemento`, complementoLike)

  }

  calcularImpuestos( receptorSatTipoPersona: EnumSatTipoPersona, conceptos: Partial<OrdenConcepto>[] ){

    return this.http.post<Importes>(`${baseUrl}/facturas/calcular-impuestos`, { receptorSatTipoPersona, conceptos } );

  }

  cancelar( createCancelacionDto: CreateCancelacionDto ):Observable<number>{

    return this.http.post<number>(`${baseUrl}/facturas/cancelar`, createCancelacionDto )
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


}
