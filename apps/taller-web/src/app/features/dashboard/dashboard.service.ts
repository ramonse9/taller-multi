import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  DashboardActivity,
  DashboardAnalytics,
  DashboardSummary,
} from "./dashboard.models";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/dashboard`;

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.url}/summary`);
  }

  activity(): Observable<DashboardActivity> {
    return this.http.get<DashboardActivity>(`${this.url}/activity`);
  }

  analytics(months: 6 | 12): Observable<DashboardAnalytics> {
    return this.http.get<DashboardAnalytics>(
      `${environment.apiUrl}/profitability/analytics`,
      { params: { months } },
    );
  }
}
