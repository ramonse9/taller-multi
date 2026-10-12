import { QueryRunner } from 'typeorm';
import { CfdiUseCatalog1700000039000, CURRENT_CFDI_USES } from './1700000039000-cfdi-use-catalog';

describe('CfdiUseCatalog1700000039000', () => {
  it('crea el catálogo vigente, su matriz y protege todos los tenants', async () => {
    const query = jest.fn((statement: string) => {
      if (statement.includes('SELECT id, schema_name FROM public.companies')) {
        return Promise.resolve([
          { id: 'company-alpha', schema_name: 'tenant_alpha' },
          { id: 'company-beta', schema_name: 'tenant_beta' },
        ]);
      }
      if (statement.includes('AS problem') && statement.includes('.customers customer')) {
        return Promise.resolve([]);
      }
      return Promise.resolve(undefined);
    });

    await new CfdiUseCatalog1700000039000().up({ query } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain('CREATE TABLE public.sat_cfdi_uses');
    expect(sql).toContain('CREATE TABLE public.sat_cfdi_use_fiscal_regimes');
    expect(sql).toContain('ALTER TABLE "tenant_alpha".customers');
    expect(sql).toContain('ALTER TABLE "tenant_beta".customers');
    expect(sql).toContain('customers_preferred_cfdi_use_code_fkey');
    expect(sql).toContain('customers_cfdi_use_requires_regime_check');
    expect(sql).toContain('VALUES ($1, 25, $2)');

    expect(CURRENT_CFDI_USES.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['G01', 'G03', 'S01', 'CP01', 'CN01']),
    );
    expect(CURRENT_CFDI_USES.map(({ code }) => code)).not.toContain('P01');
    const g01 = CURRENT_CFDI_USES.find(({ code }) => code === 'G01');
    const cp01 = CURRENT_CFDI_USES.find(({ code }) => code === 'CP01');
    expect(g01?.regimes).toContain('612');
    expect(g01?.regimes).not.toContain('605');
    expect(cp01?.regimes).toHaveLength(19);
  });

  it('detiene la migración con un diagnóstico sin reemplazar datos inválidos', async () => {
    const query = jest.fn((statement: string) => {
      if (statement.includes('SELECT id, schema_name FROM public.companies')) {
        return Promise.resolve([{ id: 'company-alpha', schema_name: 'tenant_alpha' }]);
      }
      if (statement.includes('AS problem') && statement.includes('.customers customer')) {
        return Promise.resolve([
          {
            id: 'customer-1',
            customer_type: 'person',
            fiscal_regime_code: null,
            preferred_cfdi_use_code: 'ZZZ',
            problem: 'uso inexistente',
          },
        ]);
      }
      return Promise.resolve(undefined);
    });

    await expect(
      new CfdiUseCatalog1700000039000().up({ query } as unknown as QueryRunner),
    ).rejects.toThrow(
      'No se puede migrar el schema tenant_alpha: existen preferencias de Uso CFDI inválidas',
    );

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).not.toContain('ALTER TABLE "tenant_alpha".customers');
  });
});
