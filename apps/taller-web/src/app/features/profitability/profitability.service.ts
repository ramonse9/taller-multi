import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  ProfitabilityAnalytics,
  ProfitabilityReport,
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
}
