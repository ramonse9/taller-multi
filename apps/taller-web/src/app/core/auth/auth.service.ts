import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  defer,
  finalize,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from "rxjs";
import { environment } from "../../../environments/environment";
import { SubscriptionFeature } from "../subscriptions/subscription.models";
import {
  LoginResponse,
  RefreshResponse,
  SessionUser,
} from "./auth.models";

const LEGACY_TOKEN_KEY = "taller_access_token";
const AUTH_CHANNEL_NAME = "taller-auth-session";
const AUTH_LOCK_NAME = "taller-auth-cookie";

type AuthChannelMessage =
  | { type: "logout"; source: string }
  | { type: "session-started"; source: string };

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userState = signal<SessionUser | null>(null);
  private readonly tabId = globalThis.crypto.randomUUID();
  private readonly channel =
    typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel(AUTH_CHANNEL_NAME);
  private accessToken: string | null = null;
  private refreshInFlight: Observable<string> | null = null;
  private restoreInFlight: Observable<SessionUser> | null = null;
  private logoutInFlight = false;
  private sessionEpoch = 0;

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  constructor() {
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    this.channel?.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!this.isAuthChannelMessage(event.data) || event.data.source === this.tabId) return;
      this.clearLocalSession();
      void this.router.navigateByUrl("/login");
    });
  }

  homeUrl(user: SessionUser | null = this.userState()): string {
    if (user?.mustChangePassword) return "/account";
    if (user && user.role !== "platform_admin" && !user.subscription?.usable) {
      return "/subscription-required";
    }
    if (user?.role === "platform_admin") return "/companies";
    return user?.role === "company_admin" ||
      user?.permissions.includes("dashboard.view")
      ? "/dashboard"
      : "/account";
  }

  hasFeature(feature: SubscriptionFeature): boolean {
    const user = this.userState();
    return (
      user?.role === "platform_admin" ||
      (!!user?.subscription?.usable &&
        user.subscription.features.includes(feature))
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

  get token(): string | null {
    return this.accessToken;
  }

  login(identifier: string, password: string): Observable<LoginResponse> {
    const epoch = this.sessionEpoch;
    return defer(() =>
      from(
        this.withAuthLock(() =>
          firstValueFrom(
            this.http.post<LoginResponse>(
              `${environment.apiUrl}/auth/login`,
              {
                identifier: identifier.trim().toLowerCase(),
                password,
              },
              { withCredentials: true },
            ),
          ),
        ),
      ),
    ).pipe(
      tap(({ accessToken, user }) => {
        if (epoch !== this.sessionEpoch) throw new Error("La sesión cambió durante el acceso");
        this.accessToken = accessToken;
        this.userState.set(user);
        this.broadcast("session-started");
      }),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const epoch = this.sessionEpoch;
    const refresh = defer(() =>
      from(
        this.withAuthLock(() =>
          firstValueFrom(
            this.http.post<RefreshResponse>(
              `${environment.apiUrl}/auth/refresh`,
              {},
              { withCredentials: true },
            ),
          ),
        ),
      ),
    ).pipe(
      map(({ accessToken }) => {
        if (epoch !== this.sessionEpoch) throw new Error("La sesión ya finalizó");
        this.accessToken = accessToken;
        return accessToken;
      }),
      finalize(() => {
        if (this.refreshInFlight === refresh) this.refreshInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.refreshInFlight = refresh;
    return refresh;
  }

  restoreSession(): Observable<SessionUser> {
    const currentUser = this.userState();
    if (currentUser && this.accessToken) return of(currentUser);
    if (this.restoreInFlight) return this.restoreInFlight;

    const restore = this.refreshAccessToken().pipe(
      switchMap(() =>
        this.http.get<SessionUser>(`${environment.apiUrl}/auth/me`, {
          withCredentials: true,
        }),
      ),
      tap((user) => this.userState.set(user)),
      finalize(() => {
        if (this.restoreInFlight === restore) this.restoreInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.restoreInFlight = restore;
    return restore;
  }

  logout(redirect = true): void {
    if (this.logoutInFlight) return;
    this.logoutInFlight = true;
    this.clearLocalSession();
    defer(() =>
      from(
        this.withAuthLock(() =>
          firstValueFrom(
            this.http.post<void>(
              `${environment.apiUrl}/auth/logout`,
              {},
              { withCredentials: true },
            ),
          ),
        ),
      ),
    )
      .pipe(
        finalize(() => {
          this.logoutInFlight = false;
          this.broadcast("logout");
          if (redirect) void this.router.navigateByUrl("/login");
        }),
      )
      .subscribe({ error: () => undefined });
  }

  expireSession(redirect = true): void {
    this.clearLocalSession();
    this.broadcast("logout");
    if (redirect) void this.router.navigateByUrl("/login");
  }

  finishPasswordChange(): void {
    this.clearLocalSession();
    this.broadcast("logout");
    void this.router.navigate(["/login"], {
      queryParams: { passwordChanged: "true" },
    });
  }

  private clearLocalSession(): void {
    this.sessionEpoch += 1;
    this.accessToken = null;
    this.userState.set(null);
    this.refreshInFlight = null;
    this.restoreInFlight = null;
  }

  private broadcast(type: AuthChannelMessage["type"]): void {
    this.channel?.postMessage({ type, source: this.tabId } satisfies AuthChannelMessage);
  }

  private withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
    if (typeof navigator === "undefined" || !navigator.locks) return operation();
    return navigator.locks
      .request(AUTH_LOCK_NAME, { mode: "exclusive" }, operation)
      .then((result) => result);
  }

  private isAuthChannelMessage(value: unknown): value is AuthChannelMessage {
    if (!value || typeof value !== "object") return false;
    const candidate = value as { type?: unknown; source?: unknown };
    return (
      (candidate.type === "logout" || candidate.type === "session-started") &&
      typeof candidate.source === "string"
    );
  }
}
