
import { PaginationResponse } from '@shared/interfaces/pagination.response';
import { SatTipoComprobante } from './sat-tipo-comprobante.interface';

export interface SatTiposComprobantesResponse extends PaginationResponse{
  satTiposComprobantes: SatTipoComprobante[]
}
