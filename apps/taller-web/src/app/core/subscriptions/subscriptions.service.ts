import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  ChangeSubscriptionInput,
  CompanySubscription,
  SubscriptionPlan,
  SubscriptionSummary,
} from "./subscription.models";

@Injectable({ providedIn: "root" })
export class SubscriptionsService {
  private readonly http = inject(HttpClient);

  plans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(
      `${environment.apiUrl}/subscriptions/plans`,
    );
  }

  current(): Observable<SubscriptionSummary> {
    return this.http.get<SubscriptionSummary>(
      `${environment.apiUrl}/subscriptions/current`,
    );
  }

  companies(): Observable<CompanySubscription[]> {
    return this.http.get<CompanySubscription[]>(
      `${environment.apiUrl}/subscriptions/companies`,
    );
  }

  change(
    companyId: string,
    input: ChangeSubscriptionInput,
  ): Observable<CompanySubscription> {
    return this.http.patch<CompanySubscription>(
      `${environment.apiUrl}/subscriptions/companies/${companyId}`,
      input,
    );
  }
}
