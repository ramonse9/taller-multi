import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  Order,
  OrderInput,
  OrderListOptions,
  OrderNote,
  OrderStatus,
  PaginatedOrders,
} from "./order.models";

@Injectable({ providedIn: "root" })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/orders`;

  list(options: OrderListOptions): Observable<PaginatedOrders> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit);
    if (options.search?.trim())
      params = params.set("search", options.search.trim());
    if (options.status) params = params.set("status", options.status);
    if (options.customerId)
      params = params.set("customerId", options.customerId);
    if (options.vehicleId) params = params.set("vehicleId", options.vehicleId);
    if (options.isPaid !== undefined && options.isPaid !== "")
      params = params.set("isPaid", options.isPaid);
    return this.http.get<PaginatedOrders>(this.url, { params });
  }

  getOne(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.url}/${id}`);
  }

  create(input: OrderInput): Observable<Order> {
    return this.http.post<Order>(this.url, input);
  }

  update(id: string, input: OrderInput): Observable<Order> {
    return this.http.patch<Order>(`${this.url}/${id}`, input);
  }

  changeStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.post<Order>(`${this.url}/${id}/status`, { status });
  }

  changePaymentStatus(id: string, isPaid: boolean): Observable<Order> {
    return this.http.patch<Order>(`${this.url}/${id}/payment-status`, { isPaid });
  }

  addNote(id: string, body: string): Observable<OrderNote> {
    return this.http.post<OrderNote>(`${this.url}/${id}/notes`, {
      body: body.trim(),
    });
  }
}
