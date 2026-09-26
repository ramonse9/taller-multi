import { CanActivateFn, Router, type CanMatchFn } from '@angular/router';
import { AuthService, EnumAuthStatus } from '../services/auth.service';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const isAdminGuard: CanActivateFn = async (route, state) => {

  const authService = inject(AuthService)
  const router = inject(Router)

  if( authService.authStatus() !== EnumAuthStatus.Authenticated ){
    router.navigateByUrl('/auth/login');
    return false;
  }
  
  if( authService.isAdmin() ){
    return true;
  }

  router.navigateByUrl('/error/403');
  return false;
};
