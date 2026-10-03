import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { ProfitabilityReport } from "./profitability.models";

@Injectable({ providedIn: "root" })
export class ProfitabilityService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/profitability`;

  report(occurredFrom: string, occurredTo: string): Observable<ProfitabilityReport> {
    const params = new HttpParams()
      .set("occurredFrom", occurredFrom)
      .set("occurredTo", occurredTo);
    return this.http.get<ProfitabilityReport>(this.url, { params });
  }
}
