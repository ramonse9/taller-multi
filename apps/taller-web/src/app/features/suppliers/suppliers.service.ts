import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { PaginatedSuppliers, Supplier, SupplierInput } from "./supplier.models";

@Injectable({ providedIn: "root" })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/suppliers`;

  list(options: {
    page: number;
    limit: number;
    search?: string;
    isActive: boolean;
  }): Observable<PaginatedSuppliers> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit)
      .set("isActive", options.isActive);
    if (options.search?.trim())
      params = params.set("search", options.search.trim());
    return this.http.get<PaginatedSuppliers>(this.url, { params });
  }

  create(input: SupplierInput): Observable<Supplier> {
    return this.http.post<Supplier>(this.url, input);
  }

  update(id: string, input: Partial<SupplierInput>): Observable<Supplier> {
    return this.http.patch<Supplier>(`${this.url}/${id}`, input);
  }
}
