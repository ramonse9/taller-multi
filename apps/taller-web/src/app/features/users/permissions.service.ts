import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  PermissionCatalogItem,
  PermissionTemplate,
  UpdateUserPermissionsInput,
  UserPermissionProfile,
} from "./user.models";

@Injectable({ providedIn: "root" })
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/permissions`;

  catalog(): Observable<PermissionCatalogItem[]> {
    return this.http.get<PermissionCatalogItem[]>(this.endpoint);
  }

  templates(): Observable<PermissionTemplate[]> {
    return this.http.get<PermissionTemplate[]>(`${this.endpoint}/templates`);
  }

  profile(userId: string): Observable<UserPermissionProfile> {
    return this.http.get<UserPermissionProfile>(
      `${this.endpoint}/users/${userId}`,
    );
  }

  updateProfile(
    userId: string,
    input: UpdateUserPermissionsInput,
  ): Observable<UserPermissionProfile> {
    return this.http.put<UserPermissionProfile>(
      `${this.endpoint}/users/${userId}`,
      input,
    );
  }
}
