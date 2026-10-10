import { QueryRunner } from 'typeorm';
import { RemoveSubscriptionTrials1700000036000 } from './1700000036000-remove-subscription-trials';

describe('RemoveSubscriptionTrials1700000036000', () => {
  it('activates existing trials, preserves their history and removes trial fields', async () => {
    const query = jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new RemoveSubscriptionTrials1700000036000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('previous_status, new_status');
    expect(sql).toContain("'trialing', 'active'");
    expect(sql).toContain("SET status = 'active'");
    expect(sql).toContain('current_period_starts_at = COALESCE');
    expect(sql).toContain('DROP COLUMN IF EXISTS trial_starts_at');
    expect(sql).toContain('DROP COLUMN IF EXISTS trial_ends_at');
    expect(sql).toContain("status IN ('active', 'past_due', 'suspended', 'canceled')");
  });
});
