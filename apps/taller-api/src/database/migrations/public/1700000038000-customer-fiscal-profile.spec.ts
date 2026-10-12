import { QueryRunner } from 'typeorm';
import { CustomerFiscalProfile1700000038000 } from './1700000038000-customer-fiscal-profile';

describe('CustomerFiscalProfile1700000038000', () => {
  it('creates the SAT catalog and migrates every existing tenant schema', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { id: 'company-alpha', schema_name: 'tenant_alpha' },
        { id: 'company-beta', schema_name: 'tenant_beta' },
      ])
      .mockResolvedValue(undefined);

    await new CustomerFiscalProfile1700000038000().up({ query } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain('CREATE TABLE public.sat_fiscal_regimes');
    expect(sql).toContain("('601', 'General de Ley Personas Morales', false, true)");
    expect(sql).toContain("('626', 'Régimen Simplificado de Confianza', true, true)");
    expect(sql).toContain('ALTER TABLE "tenant_alpha".customers');
    expect(sql).toContain('ALTER TABLE "tenant_beta".customers');
    expect(sql).toContain('fiscal_regime_code varchar(3)');
    expect(sql).toContain('VALUES ($1, 24, $2)');
  });
});
