import { QueryRunner } from 'typeorm';
import { PlatformCompanyUserEvents1700000037000 } from './1700000037000-platform-company-user-events';

describe('PlatformCompanyUserEvents1700000037000', () => {
  it('creates an audit trail without any password field', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new PlatformCompanyUserEvents1700000037000().up({ query } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain('CREATE TABLE public.platform_company_user_events');
    expect(sql).toContain('actor_user_id');
    expect(sql).toContain('permission_codes');
    expect(sql).not.toContain('password_hash');
  });
});
