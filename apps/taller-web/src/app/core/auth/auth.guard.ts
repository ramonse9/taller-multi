import { inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "./auth.service";
import { UserRole } from "./auth.models";
import { SubscriptionFeature } from "../subscriptions/subscription.models";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.token) return true;
  return auth.restoreSession().pipe(
    map(() => true),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.expireSession(false);
      }
      return of(router.createUrlTree(["/login"]));
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.user()) return router.createUrlTree([auth.homeUrl()]);
  return auth.restoreSession().pipe(
    map((user) => router.createUrlTree([auth.homeUrl(user)])),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.expireSession(false);
      }
      return of(true);
    }),
  );
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  const roles = route.data["roles"] as UserRole[] | undefined;
  if (user?.mustChangePassword && route.routeConfig?.path !== "account") {
    return router.createUrlTree(["/account"]);
  }
  if (user && (!roles || roles.includes(user.role))) return true;
  return router.createUrlTree([auth.homeUrl(user)]);
};

export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return router.createUrlTree([auth.homeUrl()]);
};

export const featureGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user?.role === "platform_admin") return true;
  const feature = route.data["feature"] as SubscriptionFeature | undefined;
  if (user?.subscription?.usable && (!feature || auth.hasFeature(feature))) return true;
  return router.createUrlTree(["/subscription-required"]);
};

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const configured = route.data["permission"] as string | string[] | undefined;
  const required = typeof configured === "string" ? [configured] : configured ?? [];
  if (required.every((permission) => auth.hasPermission(permission))) return true;
  return router.createUrlTree(["/access-denied"], {
    queryParams: { permission: required.join(",") },
  });
};
