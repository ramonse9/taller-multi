import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { PaginatedConcepts } from "./concept-catalog.models";

@Injectable({ providedIn: "root" })
export class ConceptCatalogService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/catalogs/concepts`;

  list(search = "", limit = 100): Observable<PaginatedConcepts> {
    let params = new HttpParams()
      .set("page", 1)
      .set("limit", limit)
      .set("isActive", true);
    if (search.trim()) params = params.set("search", search.trim());
    return this.http.get<PaginatedConcepts>(this.url, { params });
  }
}
