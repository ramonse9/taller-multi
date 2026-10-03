import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { PermissionGuard } from './permission.guard';

const user = {
  id: '02356ea5-21c1-42a3-8ba1-009ada74b7a9',
  role: PlatformRole.User,
  permissions: ['orders.view'],
} as AuthenticatedUser;

const context = (authenticatedUser: AuthenticatedUser) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user: authenticatedUser }) }),
  }) as never;

describe('PermissionGuard', () => {
  it('allows a tenant user only when every required permission is assigned', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['orders.view']),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(guard.canActivate(context(user))).toBe(true);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['orders.view', 'orders.edit']);
    expect(() => guard.canActivate(context(user))).toThrow(ForbiddenException);
  });

  it('gives the company administrator automatic access to required permissions', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['permissions.manage']),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(
      guard.canActivate(context({ ...user, role: PlatformRole.CompanyAdmin, permissions: [] })),
    ).toBe(true);
  });
});
