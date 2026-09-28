import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  CatalogListOptions,
  PaginatedCatalog,
  VehicleBrand,
  VehicleModel,
} from "./vehicle-catalog.models";

@Injectable({ providedIn: "root" })
export class VehicleCatalogService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/catalogs`;

  listBrands(
    options: CatalogListOptions,
  ): Observable<PaginatedCatalog<VehicleBrand>> {
    return this.http.get<PaginatedCatalog<VehicleBrand>>(
      `${this.endpoint}/vehicle-brands`,
      { params: this.listParams(options) },
    );
  }

  createBrand(name: string): Observable<VehicleBrand> {
    return this.http.post<VehicleBrand>(`${this.endpoint}/vehicle-brands`, {
      name,
    });
  }

  updateBrand(
    id: string,
    input: { name?: string; isActive?: boolean },
  ): Observable<VehicleBrand> {
    return this.http.patch<VehicleBrand>(
      `${this.endpoint}/vehicle-brands/${id}`,
      input,
    );
  }

  deactivateBrand(id: string): Observable<VehicleBrand> {
    return this.http.delete<VehicleBrand>(
      `${this.endpoint}/vehicle-brands/${id}`,
    );
  }

  listModels(
    brandId: string,
    options: CatalogListOptions,
  ): Observable<PaginatedCatalog<VehicleModel>> {
    return this.http.get<PaginatedCatalog<VehicleModel>>(
      `${this.endpoint}/vehicle-models`,
      { params: this.listParams(options).set("brandId", brandId) },
    );
  }

  createModel(brandId: string, name: string): Observable<VehicleModel> {
    return this.http.post<VehicleModel>(`${this.endpoint}/vehicle-models`, {
      brandId,
      name,
    });
  }

  updateModel(
    id: string,
    input: { name?: string; isActive?: boolean },
  ): Observable<VehicleModel> {
    return this.http.patch<VehicleModel>(
      `${this.endpoint}/vehicle-models/${id}`,
      input,
    );
  }

  deactivateModel(id: string): Observable<VehicleModel> {
    return this.http.delete<VehicleModel>(
      `${this.endpoint}/vehicle-models/${id}`,
    );
  }

  private listParams(options: CatalogListOptions): HttpParams {
    return new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit)
      .set("search", options.search)
      .set("isActive", options.isActive);
  }
}
