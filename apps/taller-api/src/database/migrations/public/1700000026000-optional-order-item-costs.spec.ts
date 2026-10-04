import { QueryRunner } from 'typeorm';
import { OptionalOrderItemCosts1700000026000 } from './1700000026000-optional-order-item-costs';

describe('OptionalOrderItemCosts1700000026000', () => {
  it('allows a missing cost without changing historical prices or costs', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: 'tenant_alpha' }])
      .mockResolvedValue([]);
    const runner = { query } as unknown as QueryRunner;

    await new OptionalOrderItemCosts1700000026000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS order_items_free_product_cost_check');
    expect(sql).not.toContain('ALTER COLUMN unit_price');
    expect(sql).not.toContain('UPDATE "tenant_alpha".order_items');
    expect(query.mock.calls.at(-1)?.[1]).toEqual([
      'company-id',
      'OptionalOrderItemCosts1700000026000',
    ]);
  });
});
