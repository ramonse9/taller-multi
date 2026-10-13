import { QueryRunner } from 'typeorm';
import { SimulatedInvoicingSettings1700000042000 } from './1700000042000-simulated-invoicing-settings';

describe('SimulatedInvoicingSettings1700000042000', () => {
  it('adds permissions and creates an isolated singleton configuration for every tenant', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { id: 'company-alpha', schema_name: 'tenant_alpha' },
        { id: 'company-beta', schema_name: 'tenant_beta' },
      ])
      .mockResolvedValue(undefined);

    await new SimulatedInvoicingSettings1700000042000().up({
      query,
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => String(statement)).join('\n');
    expect(sql).toContain("'invoices.view'");
    expect(sql).toContain("'invoices.configure'");
    expect(sql).toContain('CREATE TABLE "tenant_alpha".invoice_settings');
    expect(sql).toContain('CREATE TABLE "tenant_beta".invoice_settings_events');
    expect(sql).toContain("mode IN ('disabled', 'simulation')");
    expect(sql).toContain("currency_code = 'MXN'");
    expect(sql).toContain('VALUES ($1, 27, $2)');
    expect(sql).not.toContain('.cer');
    expect(sql).not.toContain('private_key');
    expect(sql).not.toContain('pac_password');
  });
});
