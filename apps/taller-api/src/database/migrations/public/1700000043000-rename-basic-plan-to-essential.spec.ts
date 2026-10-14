import { QueryRunner } from 'typeorm';
import { RenameBasicPlanToEssential1700000043000 } from './1700000043000-rename-basic-plan-to-essential';

describe('RenameBasicPlanToEssential1700000043000', () => {
  it('moves subscriptions, history, features and limits without modifying tenant data', async () => {
    const query = jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined);

    await new RenameBasicPlanToEssential1700000043000().up({
      query,
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain("SELECT 'essential', 'Esencial'");
    expect(sql).toContain('INSERT INTO public.subscription_plan_features');
    expect(sql).toContain('INSERT INTO public.subscription_plan_limits');
    expect(sql).toContain("SET plan_code = 'essential'");
    expect(sql).toContain("SET previous_plan_code = 'essential'");
    expect(sql).toContain("SET new_plan_code = 'essential'");
    expect(sql).toContain("DELETE FROM public.subscription_plans WHERE code = 'basic'");
    expect(sql).not.toContain('tenant_schema_versions');
  });
});
