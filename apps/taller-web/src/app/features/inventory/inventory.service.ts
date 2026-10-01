import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  InventoryMovement,
  InventoryMovementInput,
  InventoryMovementType,
  InventoryProduct,
  PaginatedInventoryMovements,
  PaginatedInventoryProducts,
} from "./inventory.models";

@Injectable({ providedIn: "root" })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/inventory`;

  listProducts(options: {
    page: number;
    limit: number;
    search?: string;
    lowStock?: boolean;
  }): Observable<PaginatedInventoryProducts> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit)
      .set("isActive", true);
    if (options.search?.trim())
      params = params.set("search", options.search.trim());
    if (options.lowStock !== undefined)
      params = params.set("lowStock", options.lowStock);
    return this.http.get<PaginatedInventoryProducts>(`${this.url}/products`, {
      params,
    });
  }

  getProduct(id: string): Observable<InventoryProduct> {
    return this.http.get<InventoryProduct>(`${this.url}/products/${id}`);
  }

  listMovements(options: {
    page: number;
    limit: number;
    productId?: string;
    type?: InventoryMovementType | "";
  }): Observable<PaginatedInventoryMovements> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit);
    if (options.productId) params = params.set("productId", options.productId);
    if (options.type) params = params.set("type", options.type);
    return this.http.get<PaginatedInventoryMovements>(`${this.url}/movements`, {
      params,
    });
  }

  createMovement(input: InventoryMovementInput): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${this.url}/movements`, input);
  }
}
