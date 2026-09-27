import { DataSource, QueryRunner } from 'typeorm';
import { TenantMigrator } from '../database/tenant/tenant-migrator';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';

describe('CompaniesService', () => {
  it('creates the schema and first tenant administrator in one transaction', async () => {
    const companyId = '15f9b365-87b8-47e9-8704-f984de0c980b';
    const adminId = '02356ea5-21c1-42a3-8ba1-009ada74b7a9';
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const company = {
      id: companyId,
      name: 'Taller Norte',
      schemaName: '_0001_mul_taller_norte',
      loginCode: 'taller_norte',
      companyTypeCode: 'mul',
      personTypeCode: 'individual',
      isActive: true,
      withholdsIsr: false,
      withholdsIva: false,
      createdAt,
      updatedAt: createdAt,
    } as Company;
    const query = jest
      .fn<Promise<unknown[]>, [string, unknown[]?]>()
      .mockResolvedValueOnce([
        { company_type_exists: true, person_type_exists: true, timezone_exists: true },
      ])
      .mockResolvedValueOnce([{ number: '1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: adminId,
          email: 'admin@tallernorte.mx',
          username: 'maria',
          phone: '+526671234567',
          full_name: 'María López',
          role: PlatformRole.CompanyAdmin,
          company_id: companyId,
          timezone_code: 'America/Mazatlan',
          is_active: true,
          must_change_password: true,
          created_at: createdAt,
          updated_at: createdAt,
        },
      ]);
    const commitTransaction = jest.fn();
    const rollbackTransaction = jest.fn();
    const runner = {
      query,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction,
      rollbackTransaction,
      release: jest.fn(),
      isTransactionActive: true,
      manager: {
        create: jest.fn().mockReturnValue(company),
        save: jest.fn().mockResolvedValue(company),
      },
    } as unknown as QueryRunner;
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(runner),
    } as unknown as DataSource;
    const migrateBase = jest.fn().mockResolvedValue(undefined);
    const tenantMigrator = { migrateBase } as unknown as TenantMigrator;
    const service = new CompaniesService(dataSource, tenantMigrator);

    const result = await service.create({
      name: 'Taller Norte',
      companyTypeCode: 'mul',
      personTypeCode: 'individual',
      withholdsIsr: false,
      withholdsIva: false,
      admin: {
        email: 'admin@tallernorte.mx',
        username: 'maria',
        phone: '+526671234567',
        fullName: 'María López',
        password: 'Temp2026!',
        timezoneCode: 'America/Mazatlan',
      },
    });

    expect(migrateBase).toHaveBeenCalledWith(runner, '_0001_mul_taller_norte');
    expect(commitTransaction).toHaveBeenCalledTimes(1);
    expect(rollbackTransaction).not.toHaveBeenCalled();
    expect(result.admin).toMatchObject({
      id: adminId,
      companyId,
      role: PlatformRole.CompanyAdmin,
    });
    const adminInsert = query.mock.calls.find(([sql]) => sql.includes('INSERT INTO public.users'));
    expect(adminInsert?.[1]?.[3]).toEqual(expect.stringMatching(/^\$argon2id\$/));
  });
});
