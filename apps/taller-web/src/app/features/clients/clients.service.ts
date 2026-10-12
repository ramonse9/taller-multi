import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CfdiUse,
  Client,
  ClientInput,
  CustomerType,
  FiscalRegime,
  PaginatedClients,
} from './client.models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/clients`;

  list(options: { page: number; limit: number; search: string; isActive: boolean }): Observable<PaginatedClients> {
    const params = new HttpParams()
      .set('page', options.page)
      .set('limit', options.limit)
      .set('search', options.search)
      .set('isActive', options.isActive);
    return this.http.get<PaginatedClients>(this.endpoint, { params });
  }

  getOne(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.endpoint}/${id}`);
  }

  listFiscalRegimes(customerType: CustomerType): Observable<FiscalRegime[]> {
    const params = new HttpParams().set('customerType', customerType);
    return this.http.get<FiscalRegime[]>(`${this.endpoint}/fiscal-regimes`, { params });
  }

  listCfdiUses(
    customerType: CustomerType,
    fiscalRegimeCode: string,
  ): Observable<CfdiUse[]> {
    const params = new HttpParams()
      .set('customerType', customerType)
      .set('fiscalRegimeCode', fiscalRegimeCode);
    return this.http.get<CfdiUse[]>(`${this.endpoint}/cfdi-uses`, { params });
  }

  create(input: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.endpoint, input);
  }

  update(id: string, input: Partial<ClientInput>): Observable<Client> {
    return this.http.patch<Client>(`${this.endpoint}/${id}`, input);
  }
}
