import { INVOICING_DEMO_DATASET } from './invoicing-demo.dataset';

describe('INVOICING_DEMO_DATASET', () => {
  it('covers every independent operation, collection and billing state required by the demo', () => {
    const orders = INVOICING_DEMO_DATASET.orders;
    expect(orders.some(({ status }) => status === 'in_progress')).toBe(true);
    expect(orders.some(({ status, isPaid }) => status === 'completed' && !isPaid)).toBe(true);
    expect(orders.some(({ status, isPaid }) => status === 'completed' && isPaid)).toBe(true);
    expect(orders.some(({ invoice }) => invoice === undefined)).toBe(true);
    expect(orders.some(({ invoice }) => invoice?.status === 'draft')).toBe(true);
    expect(
      orders.some(
        ({ invoice, isPaid }) =>
          invoice?.status === 'issued' && invoice.paymentMethodCode === 'PUE' && isPaid,
      ),
    ).toBe(true);
    expect(
      orders.some(
        ({ invoice, isPaid }) =>
          invoice?.status === 'issued' && invoice.paymentMethodCode === 'PPD' && !isPaid,
      ),
    ).toBe(true);
    expect(orders.some(({ invoice }) => invoice?.status === 'cancelled')).toBe(true);
  });

  it('keeps identifiers unique and every order financially coherent', () => {
    const customerKeys = INVOICING_DEMO_DATASET.customers.map(({ key }) => key);
    const orderKeys = INVOICING_DEMO_DATASET.orders.map(({ key }) => key);
    const externalFolios = INVOICING_DEMO_DATASET.orders.map(({ externalFolio }) => externalFolio);
    expect(new Set(customerKeys).size).toBe(customerKeys.length);
    expect(new Set(orderKeys).size).toBe(orderKeys.length);
    expect(new Set(externalFolios).size).toBe(externalFolios.length);
    for (const order of INVOICING_DEMO_DATASET.orders) {
      expect(customerKeys).toContain(order.customerKey);
      expect(order.items.some(({ affectsOrderTotal }) => affectsOrderTotal)).toBe(true);
      expect(
        order.items.every(
          (item) =>
            item.quantity > 0 &&
            (!item.affectsOrderTotal || (item.unitPrice !== null && item.unitPrice >= 0)),
        ),
      ).toBe(true);
      expect(order.isPaid ? order.paidAt : order.paidAt === null).toBeTruthy();
      expect(order.status === 'completed' ? order.closedAt : order.closedAt === null).toBeTruthy();
    }
  });

  it('gives Contabilidad exactly its fiscal permissions and no operational permissions', () => {
    const permissions = [...INVOICING_DEMO_DATASET.users.accounting.permissions];
    expect(permissions.sort()).toEqual(
      [
        'orders.view',
        'clients.view',
        'clients.edit_fiscal',
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.simulate_issue',
        'invoices.cancel_simulation',
      ].sort(),
    );
    expect(permissions).not.toContain('orders.create');
    expect(permissions).not.toContain('vehicles.create');
    expect(permissions).not.toContain('vehicle_catalog.manage');
    expect(permissions).not.toContain('orders.manage_payment');
    expect(permissions).not.toContain('profitability.view');
  });

  it('uses only explicitly marked fictitious customer data', () => {
    expect(INVOICING_DEMO_DATASET.company.name).toContain('Demostrativo');
    expect(
      INVOICING_DEMO_DATASET.customers.every(({ phone }) => phone.startsWith('+5266700010')),
    ).toBe(true);
  });
});
