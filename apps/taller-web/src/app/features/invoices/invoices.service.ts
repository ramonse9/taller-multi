import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  InvoiceCatalogs,
  InvoiceSettings,
  InvoiceStatus,
  InvoiceTaxInput,
  PaginatedInvoices,
  SimulatedInvoice,
} from "./invoice.models";

@Injectable({ providedIn: "root" })
export class InvoicesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/invoices`;

  catalogs(): Observable<InvoiceCatalogs> {
    return this.http.get<InvoiceCatalogs>(`${this.url}/catalogs`);
  }

  settings(): Observable<InvoiceSettings> {
    return this.http.get<InvoiceSettings>(`${this.url}/settings`);
  }

  updateSettings(input: {
    fiscalName?: string | null;
    taxId?: string | null;
    fiscalRegimeCode?: string | null;
    fiscalPostalCode?: string | null;
    defaultSeries?: string;
    pricesIncludeTax?: boolean | null;
    isActive?: boolean;
  }): Observable<InvoiceSettings> {
    return this.http.patch<InvoiceSettings>(`${this.url}/settings`, input);
  }

  list(
    page = 1,
    status: InvoiceStatus | "" = "",
  ): Observable<PaginatedInvoices> {
    let params = new HttpParams().set("page", page).set("limit", 20);
    if (status) params = params.set("status", status);
    return this.http.get<PaginatedInvoices>(this.url, { params });
  }

  getOne(id: string): Observable<SimulatedInvoice> {
    return this.http.get<SimulatedInvoice>(`${this.url}/${id}`);
  }

  create(input: {
    orderId: string;
    cfdiUseCode: string;
    paymentFormCode: string;
    paymentMethodCode: string;
    exportCode: string;
    items?: InvoiceTaxInput[];
  }): Observable<SimulatedInvoice> {
    return this.http.post<SimulatedInvoice>(this.url, input);
  }

  update(
    id: string,
    input: {
      cfdiUseCode?: string;
      paymentFormCode?: string;
      paymentMethodCode?: string;
      exportCode?: string;
      items?: InvoiceTaxInput[];
    },
  ): Observable<SimulatedInvoice> {
    return this.http.patch<SimulatedInvoice>(`${this.url}/${id}`, input);
  }

  issue(id: string): Observable<SimulatedInvoice> {
    return this.http.post<SimulatedInvoice>(
      `${this.url}/${id}/issue-simulation`,
      {},
    );
  }

  cancel(id: string): Observable<SimulatedInvoice> {
    return this.http.post<SimulatedInvoice>(
      `${this.url}/${id}/cancel-simulation`,
      {},
    );
  }

  discard(id: string): Observable<SimulatedInvoice> {
    return this.http.post<SimulatedInvoice>(
      `${this.url}/${id}/discard-draft`,
      {},
    );
  }
}
