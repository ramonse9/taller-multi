import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, ClientInput, PaginatedClients } from './client.models';

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

  create(input: ClientInput): Observable<Client> {
    return this.http.post<Client>(this.endpoint, input);
  }

  update(id: string, input: Partial<ClientInput>): Observable<Client> {
    return this.http.patch<Client>(`${this.endpoint}/${id}`, input);
  }
}
