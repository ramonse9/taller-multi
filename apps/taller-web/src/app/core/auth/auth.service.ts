import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoginResponse, SessionUser } from "./auth.models";

const TOKEN_KEY = "taller_access_token";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userState = signal<SessionUser | null>(null);

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  homeUrl(user: SessionUser | null = this.userState()): string {
    if (user?.mustChangePassword) return "/account";
    return user?.role === "platform_admin" ? "/companies" : "/clients";
  }

  completePasswordChange(): void {
    this.userState.update((user) =>
      user ? { ...user, mustChangePassword: false } : user,
    );
  }

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      })
      .pipe(
        tap(({ accessToken, user }) => {
          sessionStorage.setItem(TOKEN_KEY, accessToken);
          this.userState.set(user);
        }),
      );
  }

  restoreSession(): Observable<SessionUser> {
    return this.http
      .get<SessionUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((user) => this.userState.set(user)));
  }

  logout(redirect = true): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.userState.set(null);
    if (redirect) void this.router.navigateByUrl("/login");
  }
}
