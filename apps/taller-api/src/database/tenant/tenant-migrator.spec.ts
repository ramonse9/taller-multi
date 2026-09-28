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

  it('creates vehicles with the required profile and no odometer', () => {
    const vehicles = new TenantMigrator()
      .baseStatements('"tenant_test"')
      .find((sql) => sql.includes('CREATE TABLE "tenant_test".vehicles'));

    expect(vehicles).toBeDefined();
    expect(vehicles).toContain('brand_id uuid NOT NULL');
    expect(vehicles).toContain('model_id uuid NOT NULL');
    expect(vehicles).toContain('model_year smallint NOT NULL');
    expect(vehicles).toContain('color varchar(50) NOT NULL');
    expect(vehicles).toContain('serial_number varchar(10)');
    expect(vehicles).not.toContain('vin ');
    expect(vehicles).not.toContain('odometer');
  });
});
