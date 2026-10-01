import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  PaginatedPurchases,
  Purchase,
  PurchaseInput,
  PurchaseStatus,
} from "./purchase.models";

@Injectable({ providedIn: "root" })
export class PurchasesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/purchases`;

  list(options: {
    page: number;
    limit: number;
    search?: string;
    status?: PurchaseStatus | "";
    supplierId?: string;
  }): Observable<PaginatedPurchases> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit);
    if (options.search?.trim()) params = params.set("search", options.search.trim());
    if (options.status) params = params.set("status", options.status);
    if (options.supplierId) params = params.set("supplierId", options.supplierId);
    return this.http.get<PaginatedPurchases>(this.url, { params });
  }

  getOne(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.url}/${id}`);
  }

  create(input: PurchaseInput): Observable<Purchase> {
    return this.http.post<Purchase>(this.url, input);
  }

  update(id: string, input: Partial<PurchaseInput>): Observable<Purchase> {
    return this.http.patch<Purchase>(`${this.url}/${id}`, input);
  }

  changeStatus(id: string, status: PurchaseStatus): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.url}/${id}/status`, { status });
  }
}
