import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { SubscriptionFeature } from "../subscriptions/subscription.models";
import {
  LoginResponse,
  PasswordRecoveryRequestResponse,
  PasswordRecoveryVerifyResponse,
  SessionUser,
} from "./auth.models";

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
    if (user && user.role !== "platform_admin" && !user.subscription?.usable) {
      return "/subscription-required";
    }
    if (user?.role === "platform_admin") return "/companies";
    return user?.role === "company_admin" || user?.permissions.includes("dashboard.view")
      ? "/dashboard"
      : "/account";
  }

  hasFeature(feature: SubscriptionFeature): boolean {
    const user = this.userState();
    return (
      user?.role === "platform_admin" ||
      (!!user?.subscription?.usable && user.subscription.features.includes(feature))
    );
  }

  hasPermission(permission: string): boolean {
    const user = this.userState();
    return (
      user?.role === "platform_admin" ||
      user?.role === "company_admin" ||
      !!user?.permissions.includes(permission)
    );
  }

  completePasswordChange(): void {
    this.userState.update((user) =>
      user ? { ...user, mustChangePassword: false } : user,
    );
  }

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        identifier: identifier.trim().toLowerCase(),
        password,
      })
      .pipe(
        tap(({ accessToken, user }) => {
          sessionStorage.setItem(TOKEN_KEY, accessToken);
          this.userState.set(user);
        }),
      );
  }

  requestPasswordRecovery(
    identifier: string,
    channel: "sms" | "whatsapp",
  ): Observable<PasswordRecoveryRequestResponse> {
    return this.http.post<PasswordRecoveryRequestResponse>(
      `${environment.apiUrl}/auth/password-recovery/request`,
      { identifier: identifier.trim().toLowerCase(), channel },
    );
  }

  verifyPasswordRecovery(
    identifier: string,
    code: string,
  ): Observable<PasswordRecoveryVerifyResponse> {
    return this.http.post<PasswordRecoveryVerifyResponse>(
      `${environment.apiUrl}/auth/password-recovery/verify`,
      { identifier: identifier.trim().toLowerCase(), code },
    );
  }

  completePasswordRecovery(
    resetToken: string,
    password: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/password-recovery/complete`,
      {
        resetToken,
        password,
      },
    );
  }

  refreshToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
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
