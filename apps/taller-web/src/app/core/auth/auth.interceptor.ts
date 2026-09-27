import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, tap, throwError } from "rxjs";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const refreshedToken = event.headers.get("X-Session-Token");
        if (refreshedToken) auth.refreshToken(refreshedToken);
      }
    }),
    catchError((error: unknown) => {
      const isCredentialCheck =
        request.url.endsWith("/auth/login") ||
        request.url.endsWith("/users/me/password");
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isCredentialCheck
      ) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
