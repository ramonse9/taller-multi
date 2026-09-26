import { CanActivateFn, Router, type CanMatchFn } from '@angular/router';
import { AuthService, EnumAuthStatus } from '../services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const isRequiredRoleGuard: CanActivateFn = async (route, state) => {

  const authService = inject(AuthService)
  const router = inject(Router)

  const requiredRole = route.data?.['requiredRole'];

  const status = await firstValueFrom(
    authService.checkStatus()
  )

  if( status !== EnumAuthStatus.Authenticated ){
    router.navigateByUrl('/auth/login');
    return false;
  }

  if( requiredRole && !authService.hasRole( requiredRole ) ){
    router.navigateByUrl('/error/403');
    return false;
  }

  return true
};
