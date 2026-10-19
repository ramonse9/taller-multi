import { QueryRunner } from 'typeorm';
import { AccountingPermissionTemplate1700000047000 } from './1700000047000-accounting-permission-template';

describe('AccountingPermissionTemplate1700000047000', () => {
  it('creates the fiscal permission and the exact accounting template', async () => {
    const query = jest.fn<Promise<unknown>, [string]>().mockResolvedValue(undefined);

    await new AccountingPermissionTemplate1700000047000().up({
      query,
    } as unknown as QueryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain("'clients.edit_fiscal'");
    expect(sql).toContain("'accounting', 'Contabilidad'");
    expect(sql).toContain("'orders.view', 'clients.view', 'clients.edit_fiscal'");
    expect(sql).toContain("'invoices.cancel_simulation'");
    expect(sql).not.toContain("'invoices.configure'");
    expect(sql).toContain("profile.is_customized=false");
  });
});
