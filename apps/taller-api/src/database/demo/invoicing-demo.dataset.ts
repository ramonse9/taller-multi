export type DemoInvoiceStatus = 'draft' | 'issued' | 'cancelled';
export type DemoPaymentMethod = 'PUE' | 'PPD';

export interface InvoicingDemoCustomer {
  key: string;
  type: 'person' | 'company';
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  phone: string;
  taxId: string | null;
  fiscalName: string | null;
  fiscalPostalCode: string | null;
  fiscalRegimeCode: string | null;
  preferredCfdiUseCode: string | null;
}

export interface InvoicingDemoOrderItem {
  kind: 'service' | 'product';
  description: string;
  quantity: number;
  unitPrice: number | null;
  unitCost: number | null;
  affectsOrderTotal: boolean;
}

export interface InvoicingDemoOrder {
  key: string;
  customerKey: string;
  externalFolio: string;
  status: 'in_progress' | 'completed';
  isPaid: boolean;
  openedAt: string;
  closedAt: string | null;
  paidAt: string | null;
  items: InvoicingDemoOrderItem[];
  invoice?: {
    status: DemoInvoiceStatus;
    paymentMethodCode: DemoPaymentMethod;
    paymentFormCode: '03' | '99';
    series?: string;
    folio?: number;
    issuedAt?: string;
    cancelledAt?: string;
  };
}

const service = (
  description: string,
  unitPrice: number,
  unitCost: number | null = null,
): InvoicingDemoOrderItem => ({
  kind: 'service',
  description,
  quantity: 1,
  unitPrice,
  unitCost,
  affectsOrderTotal: true,
});

const input = (
  description: string,
  quantity: number,
  unitCost: number,
): InvoicingDemoOrderItem => ({
  kind: 'product',
  description,
  quantity,
  unitPrice: null,
  unitCost,
  affectsOrderTotal: false,
});

/**
 * Escenario completamente ficticio para demostraciones locales.
 * Los nombres, teléfonos, RFC y operaciones no representan clientes reales.
 */
export const INVOICING_DEMO_DATASET = {
  version: 'invoicing-demo-2026-10-v1',
  company: {
    name: 'Taller Demostrativo Multiservicios',
    loginCode: 'demo_facturacion',
    companyTypeCode: 'mul',
    personTypeCode: 'legal_entity',
    timezone: 'America/Mazatlan',
  },
  issuer: {
    fiscalName: 'TALLER DEMOSTRATIVO MULTISERVICIOS SA DE CV',
    taxId: 'TDM010101AA1',
    fiscalRegimeCode: '601',
    fiscalPostalCode: '80000',
    series: 'DEMO',
    nextFolio: 1004,
  },
  users: {
    operator: {
      username: 'operador',
      fullName: 'Operación Demostrativa',
      phone: '+526670000101',
      permissions: [
        'dashboard.view',
        'clients.view',
        'clients.create',
        'clients.edit',
        'vehicles.view',
        'vehicles.create',
        'vehicles.edit',
        'orders.view',
        'orders.create',
        'orders.edit',
        'orders.change_status',
        'orders.manage_payment',
        'orders.add_notes',
        'expenses.view',
        'expenses.create',
        'expenses.cancel',
        'profitability.view',
        'vehicle_catalog.view',
        'vehicle_catalog.manage',
      ],
    },
    accounting: {
      username: 'contabilidad',
      fullName: 'Contabilidad Demostrativa',
      phone: '+526670000102',
      templateCode: 'accounting',
      permissions: [
        'orders.view',
        'clients.view',
        'clients.edit_fiscal',
        'invoices.view',
        'invoices.create',
        'invoices.edit',
        'invoices.simulate_issue',
        'invoices.cancel_simulation',
      ],
    },
  },
  customers: [
    {
      key: 'maria-completa',
      type: 'person',
      displayName: 'María Demostración López',
      legalName: null,
      contactName: null,
      phone: '+526670001001',
      taxId: 'DEMO900101AA1',
      fiscalName: 'MARIA DEMOSTRACION LOPEZ',
      fiscalPostalCode: '80000',
      fiscalRegimeCode: '612',
      preferredCfdiUseCode: 'G03',
    },
    {
      key: 'empresa-completa',
      type: 'company',
      displayName: 'Transportes Ficticios del Pacífico',
      legalName: 'Transportes Ficticios del Pacífico, S.A. de C.V.',
      contactName: 'Andrea Ejemplo',
      phone: '+526670001002',
      taxId: 'TFP010101AA1',
      fiscalName: 'TRANSPORTES FICTICIOS DEL PACIFICO SA DE CV',
      fiscalPostalCode: '80000',
      fiscalRegimeCode: '601',
      preferredCfdiUseCode: 'G03',
    },
    {
      key: 'perfil-incompleto',
      type: 'person',
      displayName: 'Cliente Fiscal Pendiente',
      legalName: null,
      contactName: null,
      phone: '+526670001003',
      taxId: null,
      fiscalName: null,
      fiscalPostalCode: null,
      fiscalRegimeCode: null,
      preferredCfdiUseCode: null,
    },
  ] satisfies InvoicingDemoCustomer[],
  orders: [
    {
      key: 'in-progress',
      customerKey: 'perfil-incompleto',
      externalFolio: 'DEMO-OP-001',
      status: 'in_progress',
      isPaid: false,
      openedAt: '2026-10-15T09:00:00-07:00',
      closedAt: null,
      paidAt: null,
      items: [service('Diagnóstico general', 580), input('Material de diagnóstico', 1, 90)],
    },
    {
      key: 'completed-pending-no-invoice',
      customerKey: 'perfil-incompleto',
      externalFolio: 'DEMO-FISC-001',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-10-11T10:00:00-07:00',
      closedAt: '2026-10-11T13:30:00-07:00',
      paidAt: null,
      items: [service('Servicio de frenos', 1740), input('Juego de balatas', 1, 780)],
    },
    {
      key: 'completed-paid-no-invoice',
      customerKey: 'maria-completa',
      externalFolio: 'DEMO-FISC-002',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-10-12T08:30:00-07:00',
      closedAt: '2026-10-12T12:00:00-07:00',
      paidAt: '2026-10-12T12:15:00-07:00',
      items: [
        service('Afinación mayor', 2320),
        input('Aceite multigrado', 4, 145),
        input('Bujías', 4, 85),
      ],
    },
    {
      key: 'draft-pue-pending',
      customerKey: 'empresa-completa',
      externalFolio: 'DEMO-FISC-003',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-10-13T09:10:00-07:00',
      closedAt: '2026-10-13T15:20:00-07:00',
      paidAt: null,
      items: [
        service('Mantenimiento preventivo de unidad', 3480),
        input('Filtros y lubricantes', 1, 1120),
      ],
      invoice: { status: 'draft', paymentMethodCode: 'PUE', paymentFormCode: '03' },
    },
    {
      key: 'issued-pue-paid',
      customerKey: 'maria-completa',
      externalFolio: 'DEMO-FISC-004',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-10-08T11:00:00-07:00',
      closedAt: '2026-10-08T16:00:00-07:00',
      paidAt: '2026-10-08T16:10:00-07:00',
      items: [
        service('Cambio de soportes de motor', 2900, 350),
        input('Soportes de motor', 2, 760),
      ],
      invoice: {
        status: 'issued',
        paymentMethodCode: 'PUE',
        paymentFormCode: '03',
        series: 'DEMO',
        folio: 1001,
        issuedAt: '2026-10-08T16:30:00-07:00',
      },
    },
    {
      key: 'issued-ppd-pending',
      customerKey: 'empresa-completa',
      externalFolio: 'DEMO-FISC-005',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-10-09T08:00:00-07:00',
      closedAt: '2026-10-09T17:00:00-07:00',
      paidAt: null,
      items: [
        service('Reparación de suspensión delantera', 5220),
        input('Componentes de suspensión', 1, 2150),
      ],
      invoice: {
        status: 'issued',
        paymentMethodCode: 'PPD',
        paymentFormCode: '99',
        series: 'DEMO',
        folio: 1002,
        issuedAt: '2026-10-09T17:30:00-07:00',
      },
    },
    {
      key: 'cancelled-ppd',
      customerKey: 'empresa-completa',
      externalFolio: 'DEMO-FISC-006',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-10-06T09:00:00-07:00',
      closedAt: '2026-10-06T14:00:00-07:00',
      paidAt: null,
      items: [service('Servicio de sistema eléctrico', 1856), input('Arnés y conectores', 1, 430)],
      invoice: {
        status: 'cancelled',
        paymentMethodCode: 'PPD',
        paymentFormCode: '99',
        series: 'DEMO',
        folio: 1003,
        issuedAt: '2026-10-06T14:20:00-07:00',
        cancelledAt: '2026-10-06T15:00:00-07:00',
      },
    },
  ] satisfies InvoicingDemoOrder[],
  expenses: [
    {
      reference: 'DEMO-GASTO-001',
      categoryCode: 'rent',
      description: 'Renta del taller demostrativo',
      amount: 8500,
      occurredOn: '2026-10-01',
      recurrenceType: 'recurring',
    },
    {
      reference: 'DEMO-GASTO-002',
      categoryCode: 'utilities',
      description: 'Electricidad e internet del taller',
      amount: 1850,
      occurredOn: '2026-10-05',
      recurrenceType: 'recurring',
    },
  ],
} as const;

export const INVOICING_DEMO_ORDER_FOLIOS = INVOICING_DEMO_DATASET.orders.map(
  ({ externalFolio }) => externalFolio,
);
