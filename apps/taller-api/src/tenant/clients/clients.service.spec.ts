import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { TenantSessionService } from '../tenant-session.service';
import { ClientsService } from './clients.service';
import { CustomerType } from './dto/client.dto';

const user = {
  id: 'b9853a5f-c3f2-4096-a379-973b8ed43fea',
  email: 'user@example.com',
  username: 'user',
  loginName: 'user@alpha',
  phone: null,
  phoneVerifiedAt: null,
  fullName: 'Test User',
  role: PlatformRole.User,
  companyId: '05b8405a-d628-4a6f-bdc1-414ac4ef025a',
  companyName: 'Tenant Alpha',
  companySchema: 'tenant_alpha',
  companyLoginCode: 'alpha',
  mustChangePassword: false,
  sessionId: '76fbd920-c8c7-4bc4-83e7-b6557382a53a',
  subscription: null,
  permissions: [],
};

const row = {
  id: '983119b6-d8f4-4d6a-aa4c-c7086974b110',
  customer_type: CustomerType.Person,
  display_name: 'Ana López',
  legal_name: null,
  contact_name: null,
  tax_id: 'LOPA900101AB1',
  fiscal_name: 'ANA LÓPEZ PÉREZ',
  fiscal_postal_code: '80000',
  fiscal_regime_code: '612',
  preferred_cfdi_use_code: 'G03',
  email: 'ana@example.com',
  phone: '6671234567',
  notes: null,
  is_active: true,
  created_by_user_id: user.id,
  updated_by_user_id: user.id,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  vehicle_count: 2,
  order_count: 4,
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
    expect(result.items[0]).toMatchObject({
      id: row.id,
      type: CustomerType.Person,
      displayName: 'Ana López',
      vehicleCount: 2,
      orderCount: 4,
    });
    expect(query.mock.calls.every(([sql]) => sql.includes('"tenant_alpha".customers'))).toBe(true);
    expect(query.mock.calls[1]?.[0]).toContain('"tenant_alpha".vehicles');
    expect(query.mock.calls[1]?.[0]).toContain('"tenant_alpha".orders');
    expect(query.mock.calls[0]?.[1]).toEqual([true, '%Ana\\%\\_%']);
  });

  it('creates with server-controlled audit users and normalizes RFC', async () => {
    query.mockResolvedValueOnce([{ supports_person: true, supports_company: false }]);
    query.mockResolvedValueOnce([
      {
        supports_person: true,
        supports_company: true,
        is_active: true,
        is_current: true,
        supports_regime: true,
      },
    ]);
    query.mockResolvedValueOnce([row]);

    await service.create(user, {
      type: CustomerType.Person,
      displayName: 'Ana López',
      taxId: 'lopa900101ab1',
      fiscalName: '  Ana   López Pérez ',
      fiscalPostalCode: '80000',
      fiscalRegimeCode: '612',
      preferredCfdiUseCode: 'G03',
    });

    expect(query.mock.calls[0]?.[0]).toContain('public.sat_fiscal_regimes');
    expect(query.mock.calls[1]?.[0]).toContain('public.sat_cfdi_uses');
    expect(query.mock.calls[2]?.[1]).toEqual([
      CustomerType.Person,
      'Ana López',
      null,
      null,
      'LOPA900101AB1',
      'ANA LÓPEZ PÉREZ',
      '80000',
      '612',
      'G03',
      null,
      null,
      null,
      user.id,
    ]);
  });

  it('lists current CFDI uses compatible with customer type and fiscal regime', async () => {
    query
      .mockResolvedValueOnce([{ supports_person: true, supports_company: false }])
      .mockResolvedValueOnce([
        {
          code: 'G03',
          description: 'Gastos en general.',
          supports_person: true,
          supports_company: true,
          valid_from: '2022-01-01',
          valid_to: null,
          is_active: true,
        },
      ]);

    const result = await service.listCfdiUses(user, {
      customerType: CustomerType.Person,
      fiscalRegimeCode: '612',
    });

    expect(query.mock.calls[1]?.[0]).toContain('cfdi_use.supports_person = true');
    expect(query.mock.calls[1]?.[0]).toContain('public.sat_cfdi_use_fiscal_regimes');
    expect(query.mock.calls[1]?.[1]).toEqual(['612']);
    expect(result).toEqual([
      {
        code: 'G03',
        description: 'Gastos en general.',
        supportsPerson: true,
        supportsCompany: true,
        validFrom: '2022-01-01',
        validTo: null,
        isActive: true,
      },
    ]);
  });

  it('requires a fiscal regime when a CFDI use is selected', async () => {
    await expect(
      service.create(user, {
        type: CustomerType.Person,
        displayName: 'Sin régimen',
        preferredCfdiUseCode: 'G03',
      }),
    ).rejects.toThrow('Selecciona un régimen fiscal');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects an unknown CFDI use even when its format is valid', async () => {
    query
      .mockResolvedValueOnce([{ supports_person: true, supports_company: false }])
      .mockResolvedValueOnce([]);

    await expect(
      service.create(user, {
        type: CustomerType.Person,
        displayName: 'Uso inexistente',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'ZZZ',
      }),
    ).rejects.toThrow('no existe en el catálogo del SAT');
  });

  it('rejects inactive and incompatible CFDI uses', async () => {
    query
      .mockResolvedValueOnce([{ supports_person: true, supports_company: false }])
      .mockResolvedValueOnce([
        {
          supports_person: true,
          supports_company: true,
          is_active: false,
          is_current: true,
          supports_regime: true,
        },
      ]);

    await expect(
      service.create(user, {
        type: CustomerType.Person,
        displayName: 'Uso inactivo',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'G03',
      }),
    ).rejects.toThrow('inactivo o fuera de vigencia');

    query.mockReset();
    query
      .mockResolvedValueOnce([{ supports_person: true, supports_company: false }])
      .mockResolvedValueOnce([
        {
          supports_person: true,
          supports_company: true,
          is_active: true,
          is_current: true,
          supports_regime: false,
        },
      ]);
    await expect(
      service.create(user, {
        type: CustomerType.Person,
        displayName: 'Uso incompatible',
        fiscalRegimeCode: '612',
        preferredCfdiUseCode: 'CN01',
      }),
    ).rejects.toThrow('no es compatible con el régimen fiscal');
  });

  it('allows null to remove the preferred CFDI use', async () => {
    const cleared = { ...row, preferred_cfdi_use_code: null };
    query
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([{ supports_person: true, supports_company: false }])
      .mockResolvedValueOnce([[cleared], 1]);

    const result = await service.update(user, row.id, { preferredCfdiUseCode: null });

    expect(result.preferredCfdiUseCode).toBeNull();
    expect(query.mock.calls[2]?.[1]?.[9]).toBeNull();
  });

  it('lists only fiscal regimes compatible with the requested customer type', async () => {
    query.mockResolvedValueOnce([
      {
        code: '601',
        name: 'General de Ley Personas Morales',
        supports_person: false,
        supports_company: true,
      },
    ]);

    const result = await service.listFiscalRegimes(user, CustomerType.Company);

    expect(query.mock.calls[0]?.[0]).toContain('supports_company = true');
    expect(result).toEqual([
      {
        code: '601',
        name: 'General de Ley Personas Morales',
        supportsPerson: false,
        supportsCompany: true,
      },
    ]);
  });

  it('rejects a fiscal regime that is incompatible with the customer type', async () => {
    query.mockResolvedValueOnce([{ supports_person: false, supports_company: true }]);

    await expect(
      service.create(user, {
        type: CustomerType.Person,
        displayName: 'Persona con régimen moral',
        fiscalRegimeCode: '601',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('does not find ids outside the active tenant', async () => {
    query.mockResolvedValueOnce([]);
    await expect(service.getOne(user, row.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
