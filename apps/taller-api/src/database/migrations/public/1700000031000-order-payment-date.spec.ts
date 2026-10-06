import { QueryRunner } from 'typeorm';
import { OrderPaymentDate1700000031000 } from './1700000031000-order-payment-date';

describe('OrderPaymentDate1700000031000', () => {
  it('agrega fecha de cobro y migra órdenes pagadas en cada tenant', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: '_0001_mul_taller' }])
      .mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new OrderPaymentDate1700000031000().up(runner);

    const statements = query.mock.calls.map(([sql]) => sql);
    expect(statements.some((sql) => sql.includes('ADD COLUMN paid_at timestamptz'))).toBe(true);
    expect(statements.some((sql) => sql.includes('WHERE is_paid = true'))).toBe(true);
    expect(statements.some((sql) => sql.includes('orders_payment_state_check'))).toBe(true);
    expect(query.mock.calls.at(-1)?.[1]).toEqual(['company-id', 'OrderPaymentDate1700000031000']);
  });
});
