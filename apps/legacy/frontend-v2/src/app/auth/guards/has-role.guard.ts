import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router";
import { AuthService, EnumAuthStatus } from "@auth/services/auth.service"
import { ROLE_HIERARCHY } from "@shared/constants/role-hierarchy";
import { EnumRole } from "@shared/enums/general-estatus.enum";
import { hasRoleOrHigher } from "@shared/helpers/has-role-or-higher.helper";

export const hasRoleGuard: CanActivateFn = ( route, state ) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRole: EnumRole = route.data?.['role'];

    const isAuthenticated = authService.authStatus() === EnumAuthStatus.Authenticated;

    if(!isAuthenticated){
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      })
    }

    if( !requiredRole ) return true;

    const userRole = authService.role()

    if( !userRole ) return router.createUrlTree(['/error/403']);

    //const hasAccess =
      //ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
    const hasAccess = hasRoleOrHigher( userRole, requiredRole )

    if( hasAccess ) return true;

    return router.createUrlTree(['/error/403']);

}
