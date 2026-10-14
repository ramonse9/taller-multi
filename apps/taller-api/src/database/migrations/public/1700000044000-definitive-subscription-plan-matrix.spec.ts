import { QueryRunner } from 'typeorm';
import { DefinitiveSubscriptionPlanMatrix1700000044000 } from './1700000044000-definitive-subscription-plan-matrix';

describe('DefinitiveSubscriptionPlanMatrix1700000044000', () => {
  it('adds explicit capabilities and gives expenses and profitability to Essential', async () => {
    const query = jest.fn<Promise<unknown>, [string, unknown[]?]>().mockResolvedValue(undefined);

    await new DefinitiveSubscriptionPlanMatrix1700000044000().up({
      query,
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain("('dashboard', 'Tablero operativo'");
    expect(sql).toContain("('suppliers', 'Proveedores'");
    expect(sql).toContain("('purchases', 'Compras'");
    const baseAssignment = query.mock.calls.find(([statement]) =>
      statement.includes("WHERE plan.code IN ('essential', 'control', 'invoicing')"),
    );
    expect(baseAssignment?.[1]?.[0]).toEqual(expect.arrayContaining(['expenses', 'profitability']));
    expect(sql).toContain("WHERE plan.code IN ('control', 'invoicing')");
    expect(sql).toContain('facturación simulada sin validez fiscal');
    expect(sql).not.toContain('tenant_schema_versions');
  });
});
