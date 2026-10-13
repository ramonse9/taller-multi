import { DemoOrder, PRUEBAS_DEMO_DATASET } from './pruebas-demo.dataset';

const orderRevenue = (order: DemoOrder): number =>
  order.items.reduce(
    (total, item) => total + (item.affectsOrderTotal ? item.quantity * (item.unitPrice ?? 0) : 0),
    0,
  );

const orderCost = (order: DemoOrder): number =>
  order.items.reduce((total, item) => total + item.quantity * (item.unitCost ?? 0), 0);

describe('PRUEBAS_DEMO_DATASET', () => {
  it('define clientes ficticios con uno, dos o tres vehículos y una o dos órdenes', () => {
    expect(PRUEBAS_DEMO_DATASET.targetCompanyLoginCode).toBe('pruebas');
    expect(PRUEBAS_DEMO_DATASET.customers).toHaveLength(10);
    expect(PRUEBAS_DEMO_DATASET.vehicles).toHaveLength(17);
    expect(PRUEBAS_DEMO_DATASET.orders).toHaveLength(16);
    expect(new Set(PRUEBAS_DEMO_DATASET.customers.map(({ type }) => type))).toEqual(
      new Set(['person', 'company']),
    );

    for (const customer of PRUEBAS_DEMO_DATASET.customers) {
      const vehicleCount = PRUEBAS_DEMO_DATASET.vehicles.filter(
        ({ customerKey }) => customerKey === customer.key,
      ).length;
      const orderCount = PRUEBAS_DEMO_DATASET.orders.filter(
        ({ customerKey }) => customerKey === customer.key,
      ).length;
      expect(vehicleCount).toBeGreaterThanOrEqual(1);
      expect(vehicleCount).toBeLessThanOrEqual(3);
      expect(orderCount).toBeGreaterThanOrEqual(1);
      expect(orderCount).toBeLessThanOrEqual(2);
    }
  });

  it('distribuye las órdenes entre agosto, septiembre y octubre de 2026', () => {
    const counts = PRUEBAS_DEMO_DATASET.orders.reduce<Record<string, number>>((result, order) => {
      const month = order.openedAt.slice(0, 7);
      result[month] = (result[month] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({ '2026-08': 5, '2026-09': 5, '2026-10': 6 });
  });

  it('usa solamente conceptos libres y conserva reglas coherentes de precio y costo', () => {
    const items = PRUEBAS_DEMO_DATASET.orders.flatMap(({ items }) => items);
    expect(items.some(({ kind }) => kind === 'service')).toBe(true);
    expect(items.some(({ kind }) => kind === 'product')).toBe(true);
    expect(
      items.some(({ kind, affectsOrderTotal }) => kind === 'product' && affectsOrderTotal),
    ).toBe(true);
    expect(
      items.some(({ kind, affectsOrderTotal }) => kind === 'product' && !affectsOrderTotal),
    ).toBe(true);

    for (const item of items) {
      if (item.affectsOrderTotal) expect(item.unitPrice).not.toBeNull();
      else expect(item.unitPrice).toBeNull();
      if (item.kind === 'product') expect(item.unitCost).not.toBeNull();
    }
  });

  it('mantiene fechas, pagos y estatus consistentes', () => {
    for (const order of PRUEBAS_DEMO_DATASET.orders) {
      if (order.status === 'completed') expect(order.closedAt).not.toBeNull();
      else expect(order.closedAt).toBeNull();
      if (order.isPaid) {
        expect(order.status).toBe('completed');
        expect(order.paidAt).not.toBeNull();
      } else {
        expect(order.paidAt).toBeNull();
      }
    }
  });

  it('produce los importes mensuales planeados para la demostración', () => {
    for (const [month, expected] of Object.entries(PRUEBAS_DEMO_DATASET.expectedMonthlyResults)) {
      const orders = PRUEBAS_DEMO_DATASET.orders.filter((order) =>
        order.openedAt.startsWith(month),
      );
      const completed = orders.filter(({ status }) => status === 'completed');
      const paid = completed.filter(({ isPaid }) => isPaid);
      const generatedRevenue = completed.reduce((total, order) => total + orderRevenue(order), 0);
      const collectedRevenue = paid.reduce((total, order) => total + orderRevenue(order), 0);
      const directCost = completed.reduce((total, order) => total + orderCost(order), 0);

      expect({
        orderCount: orders.length,
        completedOrderCount: completed.length,
        paidOrderCount: paid.length,
        generatedRevenue,
        collectedRevenue,
        outstandingRevenue: generatedRevenue - collectedRevenue,
        directCost,
        grossProfit: generatedRevenue - directCost,
      }).toEqual(expected);
    }
  });
});
