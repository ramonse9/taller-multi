import { ROLE_HIERARCHY } from './../../commom/constants/role-hierarchy';
import { EnumRole } from './../../commom/enums/general.enum';
import { Reflector } from '@nestjs/core';
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from '../entities/user.entity';
import { META_ROLE } from '../decorators';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor( private readonly reflector: Reflector){
  }  

  canActivate(context: ExecutionContext): boolean {

    const requiredRole = this.reflector.getAllAndOverride<EnumRole>(
      META_ROLE,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );

    if (!requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const userRoleLevel = ROLE_HIERARCHY[user.role];
    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    return userRoleLevel >= requiredLevel;
    
  }


  
  /*canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: string[] = this.reflector.get( META_ROLE, context.getHandler() )
    
    if( !validRoles )  return true;
    if( validRoles.length === 0 ) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if(!user)
      throw new BadRequestException('User not found');

    for(const role of user.roles){
      if(validRoles.includes(role)){
        return true;
      }
    }

    throw new ForbiddenException(
      `User ${user.fullName} need a valid role: [${ validRoles }]`
    )
    
  }*/

}
