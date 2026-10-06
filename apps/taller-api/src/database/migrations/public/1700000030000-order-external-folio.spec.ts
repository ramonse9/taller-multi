import { QueryRunner } from 'typeorm';
import { OrderExternalFolio1700000030000 } from './1700000030000-order-external-folio';

describe('OrderExternalFolio1700000030000', () => {
  it('adds the optional external folio to every tenant schema', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: 'tenant_alpha' }])
      .mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new OrderExternalFolio1700000030000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN external_folio varchar(50)');
    expect(sql).toContain('CREATE INDEX orders_external_folio_idx');
    expect(query.mock.calls.at(-1)?.[1]).toEqual(['company-id', 'OrderExternalFolio1700000030000']);
  });
});
