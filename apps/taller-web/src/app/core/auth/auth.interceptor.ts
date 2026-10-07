import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "./auth.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  if (!isApiRequest(request.url)) return next(request);

  const isCookieAuthEndpoint =
    request.url.endsWith("/auth/login") ||
    request.url.endsWith("/auth/refresh") ||
    request.url.endsWith("/auth/logout");
  const token = auth.token;
  const authenticatedRequest = request.clone({
    withCredentials: true,
    ...(token && !isCookieAuthEndpoint
      ? { setHeaders: { Authorization: `Bearer ${token}` } }
      : {}),
  });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isCookieAuthEndpoint ||
        !token
      ) {
        return throwError(() => error);
      }

      const currentToken = auth.token;
      if (currentToken && currentToken !== token) {
        return next(
          request.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${currentToken}` },
          }),
        );
      }

      return auth.refreshAccessToken().pipe(
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) {
            auth.expireSession();
          }
          return throwError(() => refreshError);
        }),
        switchMap((accessToken) =>
          next(
            request.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            }),
          ),
        ),
      );
    }),
  );
};

function isApiRequest(url: string): boolean {
  const base = environment.apiUrl.replace(/\/$/, "");
  return url === base || url.startsWith(`${base}/`);
}
