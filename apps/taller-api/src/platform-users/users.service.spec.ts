import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from './entities/platform-user.entity';
import { UsersService } from './users.service';

const companyId = '15f9b365-87b8-47e9-8704-f984de0c980b';
const admin: AuthenticatedUser = {
  id: '02356ea5-21c1-42a3-8ba1-009ada74b7a9',
  email: 'admin@tallernorte.mx',
  fullName: 'María López',
  role: PlatformRole.CompanyAdmin,
  companyId,
  companySchema: 'taller_norte',
  mustChangePassword: false,
};
const row = {
  id: admin.id,
  email: admin.email,
  full_name: admin.fullName,
  role: PlatformRole.CompanyAdmin,
  company_id: companyId,
  timezone_code: 'America/Mazatlan',
  is_active: true,
  must_change_password: false,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('UsersService', () => {
  it('always scopes reads to the authenticated company', async () => {
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ total: '1' }])
      .mockResolvedValueOnce([row]);
    const service = new UsersService({ query } as unknown as DataSource);

    const result = await service.list(admin, {
      page: 1,
      limit: 20,
      search: '',
    });

    expect(result.items).toHaveLength(1);
    expect(query.mock.calls[0]?.[1]?.[0]).toBe(companyId);
    expect(query.mock.calls[1]?.[1]?.[0]).toBe(companyId);
    expect(query.mock.calls.every(([sql]) => String(sql).includes('company_id = $1'))).toBe(true);
  });

  it('does not expose user management to regular tenant users', async () => {
    const service = new UsersService({} as DataSource);
    await expect(
      service.list({ ...admin, role: PlatformRole.User }, { page: 1, limit: 20, search: '' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not find users from a different company', async () => {
    const query = jest.fn<Promise<unknown[]>, [string, unknown[]?]>().mockResolvedValueOnce([]);
    const service = new UsersService({ query } as unknown as DataSource);
    await expect(service.getOne(admin, row.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(query.mock.calls[0]?.[1]).toEqual([row.id, companyId]);
  });

  it('prevents removal of the last active company administrator', async () => {
    const otherAdminId = '49ff085a-da97-4cb9-af28-c6f771c48e1d';
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ ...row, id: otherAdminId }])
      .mockResolvedValueOnce([{ id: otherAdminId }]);
    const rollbackTransaction = jest.fn();
    const runner = {
      query,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction,
      release: jest.fn(),
      isTransactionActive: true,
    } as unknown as QueryRunner;
    const service = new UsersService({
      createQueryRunner: jest.fn().mockReturnValue(runner),
    } as unknown as DataSource);

    await expect(
      service.update(admin, otherAdminId, { role: PlatformRole.User }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(query.mock.calls.some(([sql]) => sql.includes('UPDATE public.users'))).toBe(false);
  });
});
