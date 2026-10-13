import { QueryRunner } from 'typeorm';
import { PlatformCompanyUserLifecycle1700000041000 } from './1700000041000-platform-company-user-lifecycle';

describe('PlatformCompanyUserLifecycle1700000041000', () => {
  it('extends the audit trail with lifecycle events and before/after values', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new PlatformCompanyUserLifecycle1700000041000().up({
      query,
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain('user_updated');
    expect(sql).toContain('user_deactivated');
    expect(sql).toContain('user_reactivated');
    expect(sql).toContain('previous_permission_codes');
    expect(sql).toContain('changes jsonb');
  });
});
