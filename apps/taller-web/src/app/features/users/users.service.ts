import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import {
  CreatePlatformCompanyUserInput,
  CreateUserInput,
  PaginatedUsers,
  PlatformCompanyUserResponse,
  TenantUser,
  UpdateUserInput,
} from "./user.models";

@Injectable({ providedIn: "root" })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/users`;

  list(options: {
    page: number;
    limit: number;
    search: string;
    isActive: boolean | null;
  }): Observable<PaginatedUsers> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit)
      .set("search", options.search);
    if (options.isActive !== null)
      params = params.set("isActive", options.isActive);
    return this.http.get<PaginatedUsers>(this.endpoint, { params });
  }

  create(input: CreateUserInput): Observable<TenantUser> {
    return this.http.post<TenantUser>(this.endpoint, input);
  }

  listForCompany(
    companyId: string,
    options: {
      page: number;
      limit: number;
      search: string;
      isActive: boolean | null;
    },
  ): Observable<PaginatedUsers> {
    let params = new HttpParams()
      .set("page", options.page)
      .set("limit", options.limit)
      .set("search", options.search);
    if (options.isActive !== null)
      params = params.set("isActive", options.isActive);
    return this.http.get<PaginatedUsers>(
      `${environment.apiUrl}/companies/${companyId}/users`,
      { params },
    );
  }

  createForCompany(
    companyId: string,
    input: CreatePlatformCompanyUserInput,
  ): Observable<PlatformCompanyUserResponse> {
    return this.http.post<PlatformCompanyUserResponse>(
      `${environment.apiUrl}/companies/${companyId}/users`,
      input,
    );
  }

  update(id: string, input: UpdateUserInput): Observable<TenantUser> {
    return this.http.patch<TenantUser>(`${this.endpoint}/${id}`, input);
  }

  deactivate(id: string): Observable<TenantUser> {
    return this.http.delete<TenantUser>(`${this.endpoint}/${id}`);
  }

  resetPassword(id: string, password: string): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/${id}/password`, {
      password,
    });
  }

  changeOwnPassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/me/password`, {
      currentPassword,
      newPassword,
    });
  }
}
