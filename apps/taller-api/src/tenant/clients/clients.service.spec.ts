import { NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { TenantSessionService } from '../tenant-session.service';
import { ClientsService } from './clients.service';

const user = {
  id: 'b9853a5f-c3f2-4096-a379-973b8ed43fea',
  email: 'user@example.com',
  fullName: 'Test User',
  role: PlatformRole.User,
  companyId: '05b8405a-d628-4a6f-bdc1-414ac4ef025a',
  companySchema: 'tenant_alpha',
  mustChangePassword: false,
};

const row = {
  id: '983119b6-d8f4-4d6a-aa4c-c7086974b110',
  full_name: 'Ana López',
  corporate_customer_id: null,
  tax_id: 'LOPA900101AB1',
  email: 'ana@example.com',
  phone: '6671234567',
  notes: null,
  is_active: true,
  created_by_user_id: user.id,
  updated_by_user_id: user.id,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

describe('ClientsService', () => {
  const query = jest.fn<Promise<unknown[]>, [string, unknown[]?]>();
  const runner = { query } as unknown as QueryRunner;
  const tenant = {
    run: <T>(
      _user: unknown,
      work: (activeRunner: QueryRunner, schemaName: string) => Promise<T>,
    ): Promise<T> => work(runner, 'tenant_alpha'),
  } as TenantSessionService;
  const service = new ClientsService(tenant);

  beforeEach(() => query.mockReset());

  it('paginates and qualifies every query with the resolved schema', async () => {
    query.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([row]);

    const result = await service.list(user, {
      page: 1,
      limit: 20,
      search: 'Ana%_',
      isActive: true,
    });

    expect(result).toMatchObject({ totalItems: 1, totalPages: 1, hasNextPage: false });
    expect(result.items[0]).toMatchObject({ id: row.id, fullName: 'Ana López' });
    expect(query.mock.calls.every(([sql]) => sql.includes('"tenant_alpha".customers'))).toBe(true);
    expect(query.mock.calls[0]?.[1]).toEqual([true, '%Ana\\%\\_%']);
  });

  it('creates with server-controlled audit users and normalizes RFC', async () => {
    query.mockResolvedValueOnce([row]);

    await service.create(user, { fullName: 'Ana López', taxId: 'lopa900101ab1' });

    expect(query.mock.calls[0]?.[1]).toEqual([
      'Ana López',
      null,
      'LOPA900101AB1',
      null,
      null,
      null,
      user.id,
    ]);
  });

  it('does not find ids outside the active tenant', async () => {
    query.mockResolvedValueOnce([]);
    await expect(service.getOne(user, row.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
