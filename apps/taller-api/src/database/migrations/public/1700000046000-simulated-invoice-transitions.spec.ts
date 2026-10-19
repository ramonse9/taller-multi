import { QueryRunner } from 'typeorm';
import { SimulatedInvoiceTransitions1700000046000 } from './1700000046000-simulated-invoice-transitions';

describe('SimulatedInvoiceTransitions1700000046000', () => {
  it('adds discarded drafts and limits active documents to draft and issued', async () => {
    const query = jest.fn<Promise<unknown>, [string, unknown[]?]>((sql) => {
      if (sql.includes('SELECT id, schema_name FROM public.companies')) {
        return Promise.resolve([
          { id: '11111111-1111-4111-8111-111111111111', schema_name: '_0001_mul_test' },
        ]);
      }
      if (sql.includes('pg_catalog.pg_constraint')) return Promise.resolve([]);
      if (sql.includes("invoice.status='issued'")) return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    await new SimulatedInvoiceTransitions1700000046000().up({
      query,
      connection: { driver: { escape: (value: string) => `"${value}"` } },
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN discarded_at timestamptz');
    expect(sql).toContain("status IN ('draft','issued','cancelled','discarded')");
    expect(sql).toContain("WHERE status IN ('draft','issued')");
    expect(sql).toContain("'discarded'");
    expect(sql).toContain("constraint_record.contype='c'");
    expect(sql).toContain('VALUES ($1, 29, $2)');
  });
});
