import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  CatalogConcept,
  CatalogConceptInput,
  ConceptListOptions,
  MeasurementUnit,
  MeasurementUnitInput,
  PaginatedConcepts,
} from "./concept-catalog.models";

@Injectable({ providedIn: "root" })
export class ConceptCatalogService {
  private readonly http = inject(HttpClient);
  private readonly conceptsUrl = `${environment.apiUrl}/catalogs/concepts`;
  private readonly unitsUrl = `${environment.apiUrl}/catalogs/units`;

  list(
    options: Partial<ConceptListOptions> = {},
  ): Observable<PaginatedConcepts> {
    let params = new HttpParams()
      .set("page", options.page ?? 1)
      .set("limit", options.limit ?? 100)
      .set("isActive", options.isActive ?? true);
    if (options.search?.trim())
      params = params.set("search", options.search.trim());
    if (options.kind) params = params.set("kind", options.kind);
    return this.http.get<PaginatedConcepts>(this.conceptsUrl, { params });
  }

  createConcept(input: CatalogConceptInput): Observable<CatalogConcept> {
    return this.http.post<CatalogConcept>(this.conceptsUrl, input);
  }

  updateConcept(
    id: string,
    input: Partial<CatalogConceptInput> & { isActive?: boolean },
  ): Observable<CatalogConcept> {
    return this.http.patch<CatalogConcept>(`${this.conceptsUrl}/${id}`, input);
  }

  listUnits(isActive: boolean): Observable<MeasurementUnit[]> {
    return this.http.get<MeasurementUnit[]>(this.unitsUrl, {
      params: new HttpParams().set("isActive", isActive),
    });
  }

  createUnit(input: MeasurementUnitInput): Observable<MeasurementUnit> {
    return this.http.post<MeasurementUnit>(this.unitsUrl, input);
  }

  updateUnit(
    id: string,
    input: Partial<MeasurementUnitInput> & { isActive?: boolean },
  ): Observable<MeasurementUnit> {
    return this.http.patch<MeasurementUnit>(`${this.unitsUrl}/${id}`, input);
  }
}
