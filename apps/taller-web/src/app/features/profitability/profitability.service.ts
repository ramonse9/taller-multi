import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  ProfitabilityAnalytics,
  MonthlyProfitabilityReport,
  ProfitabilityReport,
  ProfitabilityWorkbookDownload,
} from "./profitability.models";

@Injectable({ providedIn: "root" })
export class ProfitabilityService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profitability`;

  report(
    occurredFrom: string,
    occurredTo: string,
  ): Observable<ProfitabilityReport> {
    const params = new HttpParams()
      .set("occurredFrom", occurredFrom)
      .set("occurredTo", occurredTo);
    return this.http.get<ProfitabilityReport>(this.url, { params });
  }

  analytics(
    months: 6 | 12,
    endingMonth: string,
  ): Observable<ProfitabilityAnalytics> {
    const params = new HttpParams()
      .set("months", months)
      .set("endingMonth", endingMonth);
    return this.http.get<ProfitabilityAnalytics>(`${this.url}/analytics`, {
      params,
    });
  }

  monthlyReport(
    year: number,
    month: number,
  ): Observable<MonthlyProfitabilityReport> {
    return this.http.get<MonthlyProfitabilityReport>(
      `${this.url}/monthly-report`,
      { params: this.monthlyParams(year, month) },
    );
  }

  downloadMonthlyReport(
    year: number,
    month: number,
  ): Observable<ProfitabilityWorkbookDownload> {
    return this.http
      .get(`${this.url}/monthly-report.xlsx`, {
        params: this.monthlyParams(year, month),
        observe: "response",
        responseType: "blob",
      })
      .pipe(
        map((response) => {
          if (!response.body || response.body.size === 0) {
            throw new Error("El archivo generado está vacío.");
          }
          return {
            blob: response.body,
            filename: this.responseFilename(
              response.headers.get("content-disposition"),
              `reporte-ordenes-utilidad-${year}-${String(month).padStart(2, "0")}.xlsx`,
            ),
          };
        }),
      );
  }

  private monthlyParams(year: number, month: number): HttpParams {
    return new HttpParams().set("year", year).set("month", month);
  }

  private responseFilename(header: string | null, fallback: string): string {
    const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const quoted = header?.match(/filename="([^"]+)"/i)?.[1];
    const plain = header?.match(/filename=([^;]+)/i)?.[1]?.trim();
    const value = encoded ? decodeURIComponent(encoded) : (quoted ?? plain ?? fallback);
    return value.replace(/[\\/]/g, "-");
  }
}
