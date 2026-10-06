import { ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from './entities/platform-user.entity';
import { PasswordResetService } from './password-reset.service';

const companyId = '15f9b365-87b8-47e9-8704-f984de0c980b';
const actor: AuthenticatedUser = {
  id: '02356ea5-21c1-42a3-8ba1-009ada74b7a9',
  email: null,
  username: 'principal',
  loginName: 'principal@taller',
  phone: '+526671234567',
  phoneVerifiedAt: null,
  fullName: 'Administrador principal',
  role: PlatformRole.CompanyAdmin,
  companyId,
  companyName: 'Taller',
  companySchema: '_0001_mul_taller',
  companyLoginCode: 'taller',
  mustChangePassword: false,
  sessionId: '76fbd920-c8c7-4bc4-83e7-b6557382a53a',
  subscription: null,
  permissions: [],
};

type QueryMock = jest.Mock<Promise<unknown>, [string, unknown[]?]>;

function runnerWith(query: QueryMock): {
  runner: QueryRunner;
  commitTransaction: jest.Mock;
  rollbackTransaction: jest.Mock;
} {
  const commitTransaction = jest.fn();
  const rollbackTransaction = jest.fn();
  return {
    runner: {
      query,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction,
      rollbackTransaction,
      release: jest.fn(),
      isTransactionActive: true,
    } as unknown as QueryRunner,
    commitTransaction,
    rollbackTransaction,
  };
}

describe('PasswordResetService', () => {
  it('restablece de forma transaccional, revoca sesiones y registra la bitácora', async () => {
    const targetId = '49ff085a-da97-4cb9-af28-c6f771c48e1d';
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([
        { id: targetId, company_id: companyId, role: PlatformRole.Admin, is_active: true },
      ]);
    const { runner, commitTransaction } = runnerWith(query);
    const service = new PasswordResetService({
      createQueryRunner: jest.fn().mockReturnValue(runner),
    } as unknown as DataSource);

    await service.resetForTenant(actor, targetId, 'Temporal1');

    const updateCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('UPDATE public.users'),
    );
    const passwordHash = updateCall?.[1]?.[0];
    expect(typeof passwordHash).toBe('string');
    expect(await argon2.verify(passwordHash as string, 'Temporal1')).toBe(true);
    expect(
      query.mock.calls.some(([sql]) => String(sql).includes('UPDATE public.auth_sessions')),
    ).toBe(true);
    const auditCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO public.password_reset_events'),
    );
    expect(auditCall?.[1]).toEqual([
      companyId,
      targetId,
      actor.id,
      PlatformRole.CompanyAdmin,
      PlatformRole.Admin,
      'tenant_admin',
    ]);
    expect(commitTransaction).toHaveBeenCalledTimes(1);
  });

  it('impide que admin restablezca a otro administrador', async () => {
    const targetId = '49ff085a-da97-4cb9-af28-c6f771c48e1d';
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([
        { id: targetId, company_id: companyId, role: PlatformRole.Admin, is_active: true },
      ]);
    const { runner, rollbackTransaction } = runnerWith(query);
    const service = new PasswordResetService({
      createQueryRunner: jest.fn().mockReturnValue(runner),
    } as unknown as DataSource);

    await expect(
      service.resetForTenant({ ...actor, role: PlatformRole.Admin }, targetId, 'Temporal1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.some(([sql]) => String(sql).includes('UPDATE public.users'))).toBe(
      false,
    );
  });

  it('permite a plataforma restablecer al Administrador principal', async () => {
    const platform: AuthenticatedUser = {
      ...actor,
      id: '3c0f89f2-a402-4cf3-9e72-e50ebc32afc7',
      role: PlatformRole.PlatformAdmin,
      companyId: null,
      companyName: null,
      companySchema: null,
      companyLoginCode: null,
    };
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: companyId }])
      .mockResolvedValueOnce([
        {
          id: actor.id,
          company_id: companyId,
          role: PlatformRole.CompanyAdmin,
          is_active: true,
        },
      ]);
    const { runner, commitTransaction } = runnerWith(query);
    const service = new PasswordResetService({
      createQueryRunner: jest.fn().mockReturnValue(runner),
    } as unknown as DataSource);

    await service.resetPrimaryCompanyAdmin(platform, companyId, 'Temporal2');

    const auditCall = query.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO public.password_reset_events'),
    );
    expect(auditCall?.[1]).toEqual([
      companyId,
      actor.id,
      platform.id,
      PlatformRole.PlatformAdmin,
      PlatformRole.CompanyAdmin,
      'platform_admin',
    ]);
    expect(commitTransaction).toHaveBeenCalledTimes(1);
  });
});
