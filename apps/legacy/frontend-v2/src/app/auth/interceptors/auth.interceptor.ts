import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {

  if (
    req.url.includes('/auth/refresh') ||
    req.url.includes('googleapis.com')
  ) {
    return next(req);
  }

  const accessToken = inject(AuthService).accessToken();

  let headers = req.headers;

  if( accessToken ){
    headers = headers.append(
      'Authorization',
      `Bearer ${accessToken}`
    );
  }

  const newReq = req.clone({
    headers,
    withCredentials: true,
  });

  return next(newReq);
}
