import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, of } from "rxjs";
import { AuthService } from "./auth.service";
import { UserRole } from "./auth.models";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token) return router.createUrlTree(["/login"]);
  if (auth.isAuthenticated()) return true;
  return auth.restoreSession().pipe(
    map(() => true),
    catchError(() => {
      auth.logout(false);
      return of(router.createUrlTree(["/login"]));
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token) return true;
  if (auth.user()) return router.createUrlTree([auth.homeUrl()]);
  return auth.restoreSession().pipe(
    map((user) => router.createUrlTree([auth.homeUrl(user)])),
    catchError(() => {
      auth.logout(false);
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
