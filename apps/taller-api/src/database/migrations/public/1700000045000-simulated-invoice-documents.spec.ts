import { QueryRunner } from 'typeorm';
import { SimulatedInvoiceDocuments1700000045000 } from './1700000045000-simulated-invoice-documents';

describe('SimulatedInvoiceDocuments1700000045000', () => {
  it('creates supported fiscal catalogs and tenant simulation documents', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { id: '11111111-1111-4111-8111-111111111111', schema_name: '_0001_mul_test' },
      ])
      .mockResolvedValue(undefined);

    await new SimulatedInvoiceDocuments1700000045000().up({ query } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE public.sat_tax_objects');
    expect(sql).toContain('simulation_supported');
    expect(sql).not.toContain('UUID fiscal');
    expect(sql).toContain('CREATE TABLE "_0001_mul_test".simulated_invoices');
    expect(sql).toContain('CREATE TABLE "_0001_mul_test".simulated_invoice_items');
    expect(sql).toContain('CREATE TABLE "_0001_mul_test".simulated_invoice_events');
    expect(sql).toContain("status IN ('draft', 'issued', 'cancelled')");
    expect(sql).not.toContain('uuid_fiscal');
    expect(sql).not.toContain('pac_credential');
  });
});
