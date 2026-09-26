import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Options } from '@shared/interfaces/options.interface';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { EnumSatTipoPersona } from '@shared/enums/general-estatus.enum';
import { SatRegimenesFiscalesResponse } from '@facturas/interfaces/sat-regimen-fiscal.response';
import { SatUsosCFDIsResponse } from '@facturas/interfaces/sat-uso-cfdi.response';
import { SatTiposComprobantesResponse } from '@facturas/interfaces/sat-tipo-comprobante.response';
import { SatMetodosPagosResponse } from '@facturas/interfaces/sat-metodo-pago.response';
import { SatFormasPagosResponse } from '@facturas/interfaces/sat-forma-pago.response';
import { SatImpuestosResponse } from '@facturas/interfaces/sat-impuesto.response';
import { SatCancelacionesMotivosResponse } from '@facturas/interfaces/sat-cancelacion-motivo.response';
import { SatImpuestosPorcentajesResponse } from '@facturas/interfaces/sat-impuesto-porcentaje';
import { SatProductosServiciosResponse } from '@facturas/interfaces/sat-producto-servicio.response';

const baseUrl = environment.baseUrl;

@Injectable({
  providedIn: 'root'
})
export class SatService {

  private http = inject(HttpClient)

  getSatProductosServicios( options: Options, tipo: string ):Observable<SatProductosServiciosResponse>{

    const { limit = 6, page = 1, filtro = ''} = options;

    return this.http.get<SatProductosServiciosResponse>(`${baseUrl}/sat/productosservicios`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro,
        tipo: tipo
      }
    })

  }

  getSatRegimenesFiscalesByTipoPersona( options: Options, tipoPersona: EnumSatTipoPersona ):Observable<SatRegimenesFiscalesResponse>{

    const { limit = 24, page = 1, filtro = ''} = options;

    return this.http.get<SatRegimenesFiscalesResponse>(`${baseUrl}/sat/regimenesfiscales`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro,
        tipoPersona: tipoPersona
      }
    })

  }

  getSatUsoCFDIByTipoPersonaRegimenFiscal( options: Options, tipoPersona: EnumSatTipoPersona, claveSatRegimenFiscal: string ):Observable<SatUsosCFDIsResponse>{

    const { limit = 24, page = 1, filtro = ''} = options;

    return this.http.get<SatUsosCFDIsResponse>(`${baseUrl}/sat/usocfdi`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro,
        tipoPersona: tipoPersona,
        claveSatRegimenFiscal: claveSatRegimenFiscal
      }
    })

  }

  getSatTiposComprobantes( options: Options ):Observable<SatTiposComprobantesResponse>{

    const { limit = 24, page = 1, filtro = ''} = options;

    return this.http.get<SatTiposComprobantesResponse>(`${baseUrl}/sat/tiposcomprobantes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getSatMetodosPagos( options: Options ):Observable<SatMetodosPagosResponse>{

    const { limit = 24, page = 1, filtro = ''} = options;

    return this.http.get<SatMetodosPagosResponse>(`${baseUrl}/sat/metodospagos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getSatFormasPagos( options: Options ):Observable<SatFormasPagosResponse>{

    const { limit = 24, page = 1, filtro = ''} = options;

    return this.http.get<SatFormasPagosResponse>(`${baseUrl}/sat/formaspagos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getSatImpuestos( options: Options ):Observable<SatImpuestosResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<SatImpuestosResponse>(`${baseUrl}/sat/impuestos`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getSatImpuestosPorcentajes( options: Options ):Observable<SatImpuestosPorcentajesResponse>{

    const { limit = 12, page = 1, filtro = ''} = options;

    return this.http.get<SatImpuestosPorcentajesResponse>(`${baseUrl}/sat/impuestosporcentajes`, {
      params: {
        limit: limit,
        page: page,
        fSearch: filtro
      }
    })

  }

  getSatCancelacionesMotivos( options: Options ):Observable<SatCancelacionesMotivosResponse>{

    const { limit = 12, page = 1, filtro = '' } = options;

    return this.http.get<SatCancelacionesMotivosResponse>(`${baseUrl}/sat/cancelacionesmotivos`,{
      params: {
        limit: limit,
        page: 1,
        fSearch: filtro
      }
    })

  }

}
