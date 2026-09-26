import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.token) return router.createUrlTree(['/login']);
  if (auth.isAuthenticated()) return true;
  return auth.restoreSession().pipe(
    map(() => true),
    catchError(() => {
      auth.logout(false);
      return of(router.createUrlTree(['/login']));
    }),
  );
};
