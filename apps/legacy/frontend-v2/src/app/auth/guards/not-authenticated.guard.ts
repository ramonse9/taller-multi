import { Router, type CanMatchFn, type Route, type UrlSegment } from '@angular/router';
import { AuthService, EnumAuthStatus } from '../services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const NotAuthenticatedGuard: CanMatchFn = async (route: Route, segments:UrlSegment[]) => {

  const authService = inject(AuthService)

  const status = await firstValueFrom( authService.checkStatus() )

  return status !== EnumAuthStatus.Authenticated;

};
