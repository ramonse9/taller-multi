import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import {
  PermissionGuard,
  REQUIRED_ANY_PERMISSIONS_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from './permission.guard';

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
    let required = ['orders.view'];
    const reflector = {
      getAllAndOverride: jest.fn((key: unknown) =>
        key === REQUIRED_PERMISSIONS_KEY ? required : undefined,
      ),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(guard.canActivate(context(user))).toBe(true);
    required = ['orders.view', 'orders.edit'];
    expect(() => guard.canActivate(context(user))).toThrow(ForbiddenException);
  });

  it('allows a tenant user when at least one alternative permission is assigned', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === REQUIRED_ANY_PERMISSIONS_KEY ? ['orders.edit', 'orders.manage_payment'] : undefined,
      ),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(guard.canActivate(context({ ...user, permissions: ['orders.manage_payment'] }))).toBe(
      true,
    );
    expect(() => guard.canActivate(context(user))).toThrow(
      'Se requiere al menos uno de estos permisos: orders.edit, orders.manage_payment',
    );
  });

  it('gives the company administrator automatic access to required permissions', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === REQUIRED_PERMISSIONS_KEY ? ['permissions.manage'] : undefined,
      ),
    } as unknown as Reflector;
    const guard = new PermissionGuard(reflector);

    expect(
      guard.canActivate(context({ ...user, role: PlatformRole.CompanyAdmin, permissions: [] })),
    ).toBe(true);
  });
});
