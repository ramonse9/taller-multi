import { ServiceCostProfitability1700000033000 } from './1700000033000-service-cost-profitability';

describe('ServiceCostProfitability1700000033000', () => {
  it('recalculates orders while only treating free products without cost as incomplete', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'company-1', schema_name: 'tenant_test' }])
      .mockResolvedValue([]);

    await new ServiceCostProfitability1700000033000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain("item.kind = 'product'");
    expect(sql).toContain('item.product_service_id IS NULL');
    expect(sql).toContain('item.cost_total IS NULL');
    expect(sql).toContain('service_order.total - totals.total_cost');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('VALUES ($1, 23, $2)'), [
      'company-1',
      'ServiceCostProfitability1700000033000',
    ]);
  });
});
