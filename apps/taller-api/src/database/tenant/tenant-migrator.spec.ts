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
    expect(vehicles).toContain('UNIQUE (customer_id, brand_id, serial_number)');
    expect(vehicles).not.toContain('UNIQUE (license_plate)');
    expect(vehicles).not.toContain('vin ');
    expect(vehicles).not.toContain('odometer');
  });

  it('uses one customer table for people and companies', () => {
    const statements = new TenantMigrator().baseStatements('"tenant_test"');
    const customers = statements.find((sql) =>
      sql.includes('CREATE TABLE "tenant_test".customers'),
    );

    expect(customers).toContain("customer_type IN ('person', 'company')");
    expect(customers).toContain('display_name varchar(180) NOT NULL');
    expect(customers).toContain('legal_name varchar(180)');
    expect(customers).toContain('contact_name varchar(180)');
    expect(statements.join('\n')).not.toContain('corporate_customers');
    expect(statements.join('\n')).not.toContain('corporate_customer_id');
  });

  it('stores the historical kind while allowing unknown costs and legacy missing prices', () => {
    const orderItems = new TenantMigrator()
      .baseStatements('"tenant_test"')
      .find((sql) => sql.includes('CREATE TABLE "tenant_test".order_items'));

    expect(orderItems).toContain("kind varchar(10) NOT NULL CHECK (kind IN ('product','service'))");
    expect(orderItems).toContain(
      'unit_cost numeric(14,2) CHECK (unit_cost IS NULL OR unit_cost >= 0)',
    );
    expect(orderItems).toContain('unit_price numeric(14,2) CHECK (unit_price >= 0)');
    expect(orderItems).toContain('affects_order_total boolean NOT NULL DEFAULT true');
    expect(orderItems).not.toContain('order_items_free_product_cost_check');
    expect(orderItems).not.toContain("kind <> 'product' OR unit_cost IS NOT NULL");
  });

  it('creates expenses as confirmed and includes their edit audit log', () => {
    const statements = new TenantMigrator().baseStatements('"tenant_test"');
    const expenses = statements.find((sql) => sql.includes('CREATE TABLE "tenant_test".expenses'));

    expect(expenses).toContain("status varchar(20) NOT NULL DEFAULT 'confirmed'");
    expect(statements.join('\n')).toContain('CREATE TABLE "tenant_test".expense_change_history');
  });
});
