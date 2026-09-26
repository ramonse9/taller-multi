import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { CatalogItem, TimezoneCatalogItem } from "./catalog.models";

@Injectable({ providedIn: "root" })
export class CatalogsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/catalogs`;

  companyTypes(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.endpoint}/company-types`);
  }

  personTypes(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.endpoint}/person-types`);
  }

  timezones(): Observable<TimezoneCatalogItem[]> {
    return this.http.get<TimezoneCatalogItem[]>(`${this.endpoint}/timezones`);
  }
}
