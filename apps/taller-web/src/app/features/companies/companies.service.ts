import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { CompanyResponse, CreateCompanyInput } from "./company.models";

@Injectable({ providedIn: "root" })
export class CompaniesService {
  private readonly http = inject(HttpClient);

  create(input: CreateCompanyInput): Observable<CompanyResponse> {
    return this.http.post<CompanyResponse>(
      `${environment.apiUrl}/companies`,
      input,
    );
  }
}
