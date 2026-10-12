import { QueryRunner } from 'typeorm';
import { CustomerRfcValidation1700000040000 } from './1700000040000-customer-rfc-validation';

describe('CustomerRfcValidation1700000040000', () => {
  it('valida datos existentes y protege todos los schemas tenant', async () => {
    const query = jest.fn((statement: string) => {
      if (statement.includes('SELECT id, schema_name FROM public.companies')) {
        return Promise.resolve([
          { id: 'company-alpha', schema_name: 'tenant_alpha' },
          { id: 'company-beta', schema_name: 'tenant_beta' },
        ]);
      }
      if (statement.includes('AS problem') && statement.includes('.customers')) {
        return Promise.resolve([]);
      }
      return Promise.resolve(undefined);
    });

    await new CustomerRfcValidation1700000040000().up({ query } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain('ALTER TABLE "tenant_alpha".customers');
    expect(sql).toContain('ALTER TABLE "tenant_beta".customers');
    expect(sql).toContain('customers_tax_id_customer_type_check');
    expect(sql).toContain("tax_id IN ('XAXX010101000', 'XEXX010101000')");
    expect(sql).toContain("customer_type = 'person'");
    expect(sql).toContain("customer_type = 'company'");
    expect(sql).toContain('VALUES ($1, 26, $2)');
  });

  it('detiene la migración y reporta el RFC heredado inválido', async () => {
    const query = jest.fn((statement: string) => {
      if (statement.includes('SELECT id, schema_name FROM public.companies')) {
        return Promise.resolve([{ id: 'company-alpha', schema_name: 'tenant_alpha' }]);
      }
      if (statement.includes('AS problem') && statement.includes('.customers')) {
        return Promise.resolve([
          {
            id: 'customer-1',
            customer_type: 'person',
            tax_id: 'ABC010101AB1',
            problem: 'RFC de persona moral usado en persona física',
          },
        ]);
      }
      return Promise.resolve(undefined);
    });

    await expect(
      new CustomerRfcValidation1700000040000().up({ query } as unknown as QueryRunner),
    ).rejects.toThrow(
      'No se puede migrar el schema tenant_alpha: existen RFC de clientes inválidos',
    );

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).not.toContain('ALTER TABLE "tenant_alpha".customers');
  });
});
