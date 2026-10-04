import { QueryRunner } from 'typeorm';
import { OrderItemKind1700000025000 } from './1700000025000-order-item-kind';

describe('OrderItemKind1700000025000', () => {
  it('migrates catalog kinds and treats existing free concepts as zero-cost services', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ id: 'company-id', schema_name: 'tenant_alpha' }])
      .mockResolvedValue([]);
    const runner = { query } as unknown as QueryRunner;

    await new OrderItemKind1700000025000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN kind varchar(10)');
    expect(sql).toContain('SET kind = concept.kind');
    expect(sql).toContain("SET kind = 'service'");
    expect(sql).toContain('unit_cost = COALESCE(unit_cost, 0)');
    expect(sql).toContain('cost_total = COALESCE(cost_total, 0)');
    expect(sql).toContain("kind IN ('product','service')");
    expect(sql).toContain("kind <> 'product' OR unit_cost IS NOT NULL");
    expect(sql).toContain('SET total_cost = totals.total_cost');
    expect(query.mock.calls.at(-1)?.[1]).toEqual(['company-id', 'OrderItemKind1700000025000']);
  });
});
