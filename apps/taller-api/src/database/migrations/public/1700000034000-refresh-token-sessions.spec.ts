import { QueryRunner } from 'typeorm';
import { RefreshTokenSessions1700000034000 } from './1700000034000-refresh-token-sessions';

describe('RefreshTokenSessions1700000034000', () => {
  it('stores only token hashes and preserves rotation history by session', async () => {
    const query = jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new RefreshTokenSessions1700000034000().up(runner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE public.auth_refresh_tokens');
    expect(sql).toContain('token_hash varchar(128) NOT NULL UNIQUE');
    expect(sql).toContain('REFERENCES public.auth_sessions(id) ON DELETE CASCADE');
    expect(sql).toContain('consumed_at timestamptz');
    expect(sql).toContain('replaced_by_token_id uuid');
    expect(sql).not.toContain('token_value');
  });

  it('removes refresh token history without removing sessions on rollback', async () => {
    const query = jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;

    await new RefreshTokenSessions1700000034000().down(runner);

    expect(query).toHaveBeenCalledWith('DROP TABLE IF EXISTS public.auth_refresh_tokens');
  });
});
