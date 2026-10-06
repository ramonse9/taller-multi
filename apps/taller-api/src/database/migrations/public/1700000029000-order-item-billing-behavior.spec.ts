import { QueryRunner } from 'typeorm';
import { OrderItemBillingBehavior1700000029000 } from './1700000029000-order-item-billing-behavior';

describe('OrderItemBillingBehavior1700000029000', () => {
  it('preserves every existing item as billable', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: 'tenant_alpha' }])
      .mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new OrderItemBillingBehavior1700000029000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN affects_order_total boolean NOT NULL DEFAULT true');
    expect(query.mock.calls.at(-1)?.[1]).toEqual([
      'company-id',
      'OrderItemBillingBehavior1700000029000',
    ]);
  });
});
