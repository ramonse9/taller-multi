import { BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { TenantSessionService } from '../tenant-session.service';
import { InvoiceMode, IssuerType } from './dto/invoice-settings.dto';
import { InvoiceSettingsService } from './invoice-settings.service';

const user = {
  id: 'b9853a5f-c3f2-4096-a379-973b8ed43fea',
  email: 'admin@example.com',
  username: 'admin',
  loginName: 'admin@alpha',
  phone: null,
  phoneVerifiedAt: null,
  fullName: 'Admin principal',
  role: PlatformRole.CompanyAdmin,
  companyId: '05b8405a-d628-4a6f-bdc1-414ac4ef025a',
  companyName: 'Tenant Alpha',
  companySchema: 'tenant_alpha',
  companyLoginCode: 'alpha',
  mustChangePassword: false,
  sessionId: '76fbd920-c8c7-4bc4-83e7-b6557382a53a',
  subscription: null,
  permissions: [],
};

const completeRow = {
  mode: InvoiceMode.Simulation,
  fiscal_name: 'TALLER ALPHA SA DE CV',
  tax_id: 'TAL010101AB1',
  fiscal_regime_code: '601',
  fiscal_regime_name: 'General de Ley Personas Morales',
  fiscal_regime_exists: true,
  fiscal_regime_active: true,
  fiscal_regime_supports_issuer_type: true,
  fiscal_postal_code: '80000',
  default_series: 'A',
  next_internal_folio: '1',
  prices_include_tax: true,
  currency_code: 'MXN' as const,
  is_active: true,
  updated_by_user_id: user.id,
  created_at: new Date('2026-10-13T00:00:00Z'),
  updated_at: new Date('2026-10-13T00:00:00Z'),
  person_type_code: 'legal_entity',
};

describe('InvoiceSettingsService', () => {
  const query = jest.fn<Promise<unknown[]>, [string, unknown[]?]>();
  const runner = { query } as unknown as QueryRunner;
  const tenant = {
    run: <T>(
      _user: unknown,
      work: (activeRunner: QueryRunner, schemaName: string) => Promise<T>,
    ): Promise<T> => work(runner, 'tenant_alpha'),
  } as TenantSessionService;
  const dataSource = {} as DataSource;
  const service = new InvoiceSettingsService(dataSource, tenant);

  beforeEach(() => query.mockReset());

  it('calculates a complete moral-person issuer profile dynamically', async () => {
    query.mockResolvedValueOnce([completeRow]);

    const result = await service.getForTenant(user);

    expect(result).toMatchObject({
      mode: InvoiceMode.Simulation,
      issuerType: IssuerType.Company,
      currencyCode: 'MXN',
      readiness: {
        isIssuerProfileComplete: true,
        missingFields: [],
        validationIssues: [],
      },
    });
    expect(query.mock.calls[0]?.[0]).toContain('"tenant_alpha".invoice_settings');
  });

  it('reports missing fiscal fields without storing a readiness boolean', async () => {
    query.mockResolvedValueOnce([
      {
        ...completeRow,
        fiscal_name: null,
        tax_id: null,
        fiscal_regime_code: null,
        fiscal_regime_name: null,
        fiscal_regime_exists: false,
        fiscal_regime_active: false,
        fiscal_regime_supports_issuer_type: false,
        fiscal_postal_code: null,
      },
    ]);

    const result = await service.getForTenant(user);

    expect(result.readiness.isIssuerProfileComplete).toBe(false);
    expect(result.readiness.missingFields.map(({ code }) => code)).toEqual([
      'FISCAL_NAME_REQUIRED',
      'RFC_REQUIRED',
      'FISCAL_POSTAL_CODE_REQUIRED',
      'FISCAL_REGIME_REQUIRED',
    ]);
  });

  it('rejects a generic RFC for the issuer', async () => {
    query.mockResolvedValueOnce([{ ...completeRow, tax_id: 'XAXX010101000' }]);
    query.mockResolvedValueOnce([
      {
        name: completeRow.fiscal_regime_name,
        is_active: true,
        supports_person: false,
        supports_company: true,
      },
    ]);

    await expect(
      service.updateForTenant(user, { fiscalName: 'TALLER ALPHA ACTUALIZADO' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query.mock.calls.some(([sql]) => sql.includes('UPDATE "tenant_alpha"'))).toBe(false);
  });

  it('updates only issuer settings and records the change in the tenant audit log', async () => {
    query.mockResolvedValueOnce([completeRow]);
    query.mockResolvedValueOnce([
      {
        name: completeRow.fiscal_regime_name,
        is_active: true,
        supports_person: false,
        supports_company: true,
      },
    ]);
    query.mockResolvedValueOnce([]);
    query.mockResolvedValueOnce([]);
    query.mockResolvedValueOnce([{ ...completeRow, default_series: 'SIM' }]);

    const result = await service.updateForTenant(user, { defaultSeries: 'SIM' });

    expect(result.defaultSeries).toBe('SIM');
    expect(query.mock.calls[2]?.[0]).toContain('UPDATE "tenant_alpha".invoice_settings');
    expect(query.mock.calls[3]?.[0]).toContain(
      'INSERT INTO "tenant_alpha".invoice_settings_events',
    );
    expect(query.mock.calls[2]?.[0]).not.toContain('mode =');
  });
});
