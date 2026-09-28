import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Vehicle, VehicleHistory, VehicleInput } from "./vehicle.models";

@Injectable({ providedIn: "root" })
export class VehiclesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/clients`;

  list(clientId: string): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.endpoint}/${clientId}/vehicles`);
  }

  create(clientId: string, input: VehicleInput): Observable<Vehicle> {
    return this.http.post<Vehicle>(
      `${this.endpoint}/${clientId}/vehicles`,
      input,
    );
  }

  update(
    clientId: string,
    id: string,
    input: Partial<VehicleInput>,
  ): Observable<Vehicle> {
    return this.http.patch<Vehicle>(
      `${this.endpoint}/${clientId}/vehicles/${id}`,
      input,
    );
  }

  history(numeroSerie: string, brandId?: string): Observable<VehicleHistory> {
    let params = new HttpParams().set("numeroSerie", numeroSerie);
    if (brandId) params = params.set("brandId", brandId);
    return this.http.get<VehicleHistory>(
      `${environment.apiUrl}/vehicles/history`,
      { params },
    );
  }
}
