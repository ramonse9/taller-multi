import { TenantMigrator } from './tenant-migrator';

describe('TenantMigrator', () => {
  it('qualifies every tenant table and never creates a private table in public', () => {
    const statements = new TenantMigrator().baseStatements('"tenant_test"');
    const creates = statements.filter((sql) => /CREATE TABLE/.test(sql));
    expect(creates.length).toBeGreaterThan(10);
    expect(creates.every((sql) => /CREATE TABLE "tenant_test"\./.test(sql))).toBe(true);
    expect(creates.some((sql) => /CREATE TABLE public\./.test(sql))).toBe(false);
    expect(creates.join('\n')).not.toContain('NULLS NOT DISTINCT');
  });
});
