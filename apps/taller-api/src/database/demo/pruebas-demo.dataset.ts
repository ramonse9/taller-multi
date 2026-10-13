export type DemoCustomerType = 'person' | 'company';
export type DemoOrderStatus = 'in_progress' | 'completed';
export type DemoItemKind = 'service' | 'product';

export interface DemoCustomer {
  key: string;
  type: DemoCustomerType;
  displayName: string;
  legalName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string;
  notes: string;
}

export interface DemoVehicle {
  key: string;
  customerKey: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  numeroSerie: string | null;
  licensePlate: string | null;
}

export interface DemoOrderItem {
  kind: DemoItemKind;
  description: string;
  quantity: number;
  affectsOrderTotal: boolean;
  unitPrice: number | null;
  unitCost: number | null;
}

export interface DemoOrder {
  key: string;
  customerKey: string;
  vehicleKey: string;
  externalFolio: string;
  status: DemoOrderStatus;
  isPaid: boolean;
  openedAt: string;
  closedAt: string | null;
  paidAt: string | null;
  notes: string[];
  items: DemoOrderItem[];
}

export interface DemoMonthlyExpectation {
  orderCount: number;
  completedOrderCount: number;
  paidOrderCount: number;
  generatedRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  directCost: number;
  grossProfit: number;
}

const service = (
  description: string,
  unitPrice: number,
  unitCost: number | null = null,
  quantity = 1,
): DemoOrderItem => ({
  kind: 'service',
  description,
  quantity,
  affectsOrderTotal: true,
  unitPrice,
  unitCost,
});

const input = (description: string, unitCost: number, quantity = 1): DemoOrderItem => ({
  kind: 'product',
  description,
  quantity,
  affectsOrderTotal: false,
  unitPrice: null,
  unitCost,
});

const soldProduct = (
  description: string,
  unitPrice: number,
  unitCost: number,
  quantity = 1,
): DemoOrderItem => ({
  kind: 'product',
  description,
  quantity,
  affectsOrderTotal: true,
  unitPrice,
  unitCost,
});

/**
 * Datos completamente ficticios para presentar el producto.
 *
 * Este archivo solamente define el escenario. El cargador del siguiente bloque debe resolver
 * marcas/modelos, usuarios y folios internos, y debe negarse a operar fuera de la compañía
 * cuyo código público sea `pruebas`.
 */
export const PRUEBAS_DEMO_DATASET = {
  version: 'control-bodyshop-2026-10-v1',
  targetCompanyLoginCode: 'pruebas',
  timezone: 'America/Mazatlan',
  customers: [
    {
      key: 'laura-medina',
      type: 'person',
      displayName: 'Laura Medina Salas',
      legalName: null,
      contactName: null,
      email: 'laura.medina@example.com',
      phone: '+526670000001',
      notes: 'Cliente demostrativo. Prefiere seguimiento por teléfono.',
    },
    {
      key: 'carlos-valdez',
      type: 'person',
      displayName: 'Carlos Valdez Moreno',
      legalName: null,
      contactName: null,
      email: null,
      phone: '+526670000002',
      notes: 'Cliente demostrativo con vehículo de trabajo.',
    },
    {
      key: 'ana-torres',
      type: 'person',
      displayName: 'Ana Torres Beltrán',
      legalName: null,
      contactName: null,
      email: 'ana.torres@example.com',
      phone: '+526670000003',
      notes: 'Cliente demostrativo.',
    },
    {
      key: 'roberto-cardenas',
      type: 'person',
      displayName: 'Roberto Cárdenas Vega',
      legalName: null,
      contactName: null,
      email: null,
      phone: '+526670000004',
      notes: 'Cliente demostrativo recurrente.',
    },
    {
      key: 'distribuciones-pacifico',
      type: 'company',
      displayName: 'Distribuciones del Pacífico',
      legalName: 'Distribuciones del Pacífico, S.A. de C.V.',
      contactName: 'Mónica Ríos',
      email: 'flotilla.pacifico@example.com',
      phone: '+526670000005',
      notes: 'Empresa demostrativa con flotilla de reparto.',
    },
    {
      key: 'constructora-tres-rios',
      type: 'company',
      displayName: 'Constructora Tres Ríos',
      legalName: 'Constructora Tres Ríos, S.A. de C.V.',
      contactName: 'Iván Meza',
      email: 'operaciones.tresrios@example.com',
      phone: '+526670000006',
      notes: 'Empresa demostrativa con camionetas de trabajo.',
    },
    {
      key: 'mariana-lopez',
      type: 'person',
      displayName: 'Mariana López Duarte',
      legalName: null,
      contactName: null,
      email: 'mariana.lopez@example.com',
      phone: '+526670000007',
      notes: 'Cliente demostrativo.',
    },
    {
      key: 'jose-rivera',
      type: 'person',
      displayName: 'José Rivera Campos',
      legalName: null,
      contactName: null,
      email: null,
      phone: '+526670000008',
      notes: 'Cliente demostrativo con saldo pendiente.',
    },
    {
      key: 'transportes-valle',
      type: 'company',
      displayName: 'Transportes del Valle',
      legalName: 'Transportes del Valle de Sinaloa, S.A. de C.V.',
      contactName: 'Daniela Soto',
      email: 'mantenimiento.valle@example.com',
      phone: '+526670000009',
      notes: 'Empresa demostrativa con unidades de reparto.',
    },
    {
      key: 'elena-castro',
      type: 'person',
      displayName: 'Elena Castro Núñez',
      legalName: null,
      contactName: null,
      email: 'elena.castro@example.com',
      phone: '+526670000010',
      notes: 'Cliente demostrativo con trabajo en proceso.',
    },
  ] satisfies DemoCustomer[],
  vehicles: [
    {
      key: 'laura-xtrail',
      customerKey: 'laura-medina',
      brand: 'Nissan',
      model: 'X-Trail',
      year: 2021,
      color: 'Gris',
      numeroSerie: 'DMV26A0001',
      licensePlate: 'DEM-001-A',
    },
    {
      key: 'laura-mazda3',
      customerKey: 'laura-medina',
      brand: 'Mazda',
      model: 'Mazda 3',
      year: 2019,
      color: 'Rojo',
      numeroSerie: 'DMV26A0002',
      licensePlate: 'DEM-002-A',
    },
    {
      key: 'laura-aveo',
      customerKey: 'laura-medina',
      brand: 'Chevrolet',
      model: 'Aveo',
      year: 2017,
      color: 'Blanco',
      numeroSerie: null,
      licensePlate: 'DEM-003-A',
    },
    {
      key: 'carlos-ranger',
      customerKey: 'carlos-valdez',
      brand: 'Ford',
      model: 'Ranger',
      year: 2020,
      color: 'Blanco',
      numeroSerie: 'DMV26B0001',
      licensePlate: 'DEM-004-A',
    },
    {
      key: 'ana-rio',
      customerKey: 'ana-torres',
      brand: 'Kia',
      model: 'Rio',
      year: 2022,
      color: 'Azul',
      numeroSerie: 'DMV26C0001',
      licensePlate: 'DEM-005-A',
    },
    {
      key: 'ana-crv',
      customerKey: 'ana-torres',
      brand: 'Honda',
      model: 'CR-V',
      year: 2018,
      color: 'Plata',
      numeroSerie: null,
      licensePlate: 'DEM-006-A',
    },
    {
      key: 'roberto-versa',
      customerKey: 'roberto-cardenas',
      brand: 'Nissan',
      model: 'Versa',
      year: 2016,
      color: 'Gris',
      numeroSerie: 'DMV26D0001',
      licensePlate: 'DEM-007-A',
    },
    {
      key: 'pacifico-silverado',
      customerKey: 'distribuciones-pacifico',
      brand: 'Chevrolet',
      model: 'Silverado',
      year: 2022,
      color: 'Blanco',
      numeroSerie: 'DMV26E0001',
      licensePlate: 'DEM-008-A',
    },
    {
      key: 'pacifico-np300',
      customerKey: 'distribuciones-pacifico',
      brand: 'Nissan',
      model: 'NP300',
      year: 2021,
      color: 'Blanco',
      numeroSerie: 'DMV26E0002',
      licensePlate: 'DEM-009-A',
    },
    {
      key: 'pacifico-hilux',
      customerKey: 'distribuciones-pacifico',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2020,
      color: 'Plata',
      numeroSerie: null,
      licensePlate: 'DEM-010-A',
    },
    {
      key: 'constructora-f150',
      customerKey: 'constructora-tres-rios',
      brand: 'Ford',
      model: 'F-150',
      year: 2019,
      color: 'Blanco',
      numeroSerie: 'DMV26F0001',
      licensePlate: 'DEM-011-A',
    },
    {
      key: 'constructora-ram',
      customerKey: 'constructora-tres-rios',
      brand: 'Ram',
      model: '1500',
      year: 2021,
      color: 'Negro',
      numeroSerie: 'DMV26F0002',
      licensePlate: 'DEM-012-A',
    },
    {
      key: 'mariana-jetta',
      customerKey: 'mariana-lopez',
      brand: 'Volkswagen',
      model: 'Jetta',
      year: 2020,
      color: 'Azul',
      numeroSerie: 'DMV26G0001',
      licensePlate: 'DEM-013-A',
    },
    {
      key: 'jose-tucson',
      customerKey: 'jose-rivera',
      brand: 'Hyundai',
      model: 'Tucson',
      year: 2018,
      color: 'Gris',
      numeroSerie: null,
      licensePlate: 'DEM-014-A',
    },
    {
      key: 'valle-urvan',
      customerKey: 'transportes-valle',
      brand: 'Nissan',
      model: 'Urvan',
      year: 2020,
      color: 'Blanco',
      numeroSerie: 'DMV26H0001',
      licensePlate: 'DEM-015-A',
    },
    {
      key: 'valle-tornado',
      customerKey: 'transportes-valle',
      brand: 'Chevrolet',
      model: 'Tornado',
      year: 2019,
      color: 'Blanco',
      numeroSerie: 'DMV26H0002',
      licensePlate: 'DEM-016-A',
    },
    {
      key: 'elena-corolla',
      customerKey: 'elena-castro',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2023,
      color: 'Perla',
      numeroSerie: 'DMV26J0001',
      licensePlate: 'DEM-017-A',
    },
  ] satisfies DemoVehicle[],
  orders: [
    {
      key: 'aug-001',
      customerKey: 'laura-medina',
      vehicleKey: 'laura-xtrail',
      externalFolio: 'DEMO-AGO-001',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-08-03T09:20:00-07:00',
      closedAt: '2026-08-05T16:10:00-07:00',
      paidAt: '2026-08-05T16:20:00-07:00',
      notes: ['Se reparó la fascia delantera y se igualó el color.'],
      items: [
        service('Reparación y pintura de fascia delantera', 4800),
        input('Pintura, primer y transparente', 950),
        input('Consumibles de preparación', 350),
      ],
    },
    {
      key: 'aug-002',
      customerKey: 'carlos-valdez',
      vehicleKey: 'carlos-ranger',
      externalFolio: 'DEMO-AGO-002',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-08-08T08:45:00-07:00',
      closedAt: '2026-08-12T17:30:00-07:00',
      paidAt: '2026-08-13T10:00:00-07:00',
      notes: ['Trabajo terminado y entregado al cliente.'],
      items: [
        service('Enderezado y pintura de puerta derecha', 6200),
        service('Alineación externa de puerta', 900, 500),
        input('Material de pintura', 1200),
        input('Grapas y consumibles', 480),
      ],
    },
    {
      key: 'aug-003',
      customerKey: 'roberto-cardenas',
      vehicleKey: 'roberto-versa',
      externalFolio: 'DEMO-AGO-003',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-08-15T10:10:00-07:00',
      closedAt: '2026-08-18T15:40:00-07:00',
      paidAt: '2026-08-18T15:45:00-07:00',
      notes: ['Se corrigieron rayones y deformación menor.'],
      items: [
        service('Reparación y pintura de defensa trasera', 3600),
        input('Pintura y transparente', 700),
        input('Lijas y cinta', 240),
      ],
    },
    {
      key: 'aug-004',
      customerKey: 'distribuciones-pacifico',
      vehicleKey: 'pacifico-silverado',
      externalFolio: 'DEMO-AGO-004',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-08-19T09:00:00-07:00',
      closedAt: '2026-08-24T17:50:00-07:00',
      paidAt: '2026-08-26T12:30:00-07:00',
      notes: ['Unidad de flotilla entregada con revisión final.'],
      items: [
        service('Reparación de costado y pintura', 8500),
        input('Material de pintura y sellador', 1800),
        input('Consumibles de hojalatería', 650),
      ],
    },
    {
      key: 'aug-005',
      customerKey: 'jose-rivera',
      vehicleKey: 'jose-tucson',
      externalFolio: 'DEMO-AGO-005',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-08-27T11:15:00-07:00',
      closedAt: '2026-08-29T14:20:00-07:00',
      paidAt: null,
      notes: ['Trabajo entregado; quedó pendiente el cobro.'],
      items: [
        service('Pulido general y corrección de pintura', 2600),
        input('Compuestos y pads de pulido', 380),
      ],
    },
    {
      key: 'sep-001',
      customerKey: 'carlos-valdez',
      vehicleKey: 'carlos-ranger',
      externalFolio: 'DEMO-SEP-001',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-09-01T09:30:00-07:00',
      closedAt: '2026-09-03T16:00:00-07:00',
      paidAt: '2026-09-03T16:10:00-07:00',
      notes: ['Retoque localizado terminado.'],
      items: [
        service('Retoque y pintura de caja', 3200),
        input('Pintura y transparente', 620),
        input('Consumibles', 180),
      ],
    },
    {
      key: 'sep-002',
      customerKey: 'ana-torres',
      vehicleKey: 'ana-rio',
      externalFolio: 'DEMO-SEP-002',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-09-05T10:00:00-07:00',
      closedAt: '2026-09-09T15:20:00-07:00',
      paidAt: '2026-09-09T15:30:00-07:00',
      notes: ['Fascia ajustada y pintada.'],
      items: [
        service('Reparación de fascia y ajuste de soportes', 4200),
        input('Material de pintura', 850),
        input('Soportes y grapas', 300),
      ],
    },
    {
      key: 'sep-003',
      customerKey: 'distribuciones-pacifico',
      vehicleKey: 'pacifico-np300',
      externalFolio: 'DEMO-SEP-003',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-09-10T08:30:00-07:00',
      closedAt: '2026-09-15T17:10:00-07:00',
      paidAt: null,
      notes: ['Pendiente de pago por parte de la empresa.'],
      items: [
        service('Enderezado de caja y pintura parcial', 6900),
        input('Pintura y primer', 1450),
        input('Material de soldadura y consumibles', 520),
      ],
    },
    {
      key: 'sep-004',
      customerKey: 'constructora-tres-rios',
      vehicleKey: 'constructora-f150',
      externalFolio: 'DEMO-SEP-004',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-09-16T09:10:00-07:00',
      closedAt: '2026-09-22T17:40:00-07:00',
      paidAt: '2026-09-24T11:15:00-07:00',
      notes: ['Reparación mayor terminada y autorizada por el encargado.'],
      items: [
        service('Reparación de golpe lateral y pintura', 10800),
        input('Material de pintura', 2400),
        input('Insumos de hojalatería', 950),
      ],
    },
    {
      key: 'sep-005',
      customerKey: 'transportes-valle',
      vehicleKey: 'valle-urvan',
      externalFolio: 'DEMO-SEP-005',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-09-24T08:20:00-07:00',
      closedAt: '2026-09-28T16:50:00-07:00',
      paidAt: '2026-09-30T13:00:00-07:00',
      notes: ['Unidad de reparto entregada.'],
      items: [
        service('Reparación y pintura de puerta corrediza', 5800),
        input('Material de pintura', 1100),
        input('Rodillos, grapas y consumibles', 460),
      ],
    },
    {
      key: 'oct-001',
      customerKey: 'laura-medina',
      vehicleKey: 'laura-mazda3',
      externalFolio: 'DEMO-OCT-001',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-10-01T09:15:00-07:00',
      closedAt: '2026-10-03T15:30:00-07:00',
      paidAt: '2026-10-03T15:40:00-07:00',
      notes: ['Cofre reparado, pintado y pulido.'],
      items: [
        service('Reparación y pintura de cofre', 5200),
        input('Material de pintura', 1050),
        input('Consumibles de preparación', 350),
      ],
    },
    {
      key: 'oct-002',
      customerKey: 'roberto-cardenas',
      vehicleKey: 'roberto-versa',
      externalFolio: 'DEMO-OCT-002',
      status: 'completed',
      isPaid: true,
      openedAt: '2026-10-03T10:25:00-07:00',
      closedAt: '2026-10-06T16:45:00-07:00',
      paidAt: '2026-10-06T17:00:00-07:00',
      notes: ['Incluye una moldura cobrada por separado.'],
      items: [
        service('Cambio y pintura de fascia delantera', 4500),
        soldProduct('Moldura lateral', 850, 520),
        input('Material de pintura', 400),
      ],
    },
    {
      key: 'oct-003',
      customerKey: 'constructora-tres-rios',
      vehicleKey: 'constructora-ram',
      externalFolio: 'DEMO-OCT-003',
      status: 'completed',
      isPaid: false,
      openedAt: '2026-10-02T08:40:00-07:00',
      closedAt: '2026-10-08T17:20:00-07:00',
      paidAt: null,
      notes: ['Trabajo entregado; factura y pago pendientes.'],
      items: [
        service('Enderezado de caja y pintura completa', 9600),
        input('Material de pintura y sellador', 2100),
        input('Consumibles de hojalatería', 750),
      ],
    },
    {
      key: 'oct-004',
      customerKey: 'mariana-lopez',
      vehicleKey: 'mariana-jetta',
      externalFolio: 'DEMO-OCT-004',
      status: 'in_progress',
      isPaid: false,
      openedAt: '2026-10-09T09:50:00-07:00',
      closedAt: null,
      paidAt: null,
      notes: ['En preparación para aplicar pintura.'],
      items: [
        service('Reparación y pintura de salpicadera', 3800),
        input('Material de pintura', 780),
        input('Consumibles', 260),
      ],
    },
    {
      key: 'oct-005',
      customerKey: 'transportes-valle',
      vehicleKey: 'valle-tornado',
      externalFolio: 'DEMO-OCT-005',
      status: 'in_progress',
      isPaid: false,
      openedAt: '2026-10-11T08:15:00-07:00',
      closedAt: null,
      paidAt: null,
      notes: ['Pendiente de terminar enderezado y preparar pintura.'],
      items: [
        service('Reparación de costado derecho', 7200),
        input('Material de pintura', 1700),
        input('Insumos de hojalatería', 540),
      ],
    },
    {
      key: 'oct-006',
      customerKey: 'elena-castro',
      vehicleKey: 'elena-corolla',
      externalFolio: 'DEMO-OCT-006',
      status: 'in_progress',
      isPaid: false,
      openedAt: '2026-10-12T11:30:00-07:00',
      closedAt: null,
      paidAt: null,
      notes: ['Vehículo recibido y en proceso de preparación.'],
      items: [
        service('Corrección de rayones y pulido', 2900),
        input('Compuestos y consumibles', 420),
      ],
    },
  ] satisfies DemoOrder[],
  expectedMonthlyResults: {
    '2026-08': {
      orderCount: 5,
      completedOrderCount: 5,
      paidOrderCount: 4,
      generatedRevenue: 26600,
      collectedRevenue: 24000,
      outstandingRevenue: 2600,
      directCost: 7250,
      grossProfit: 19350,
    },
    '2026-09': {
      orderCount: 5,
      completedOrderCount: 5,
      paidOrderCount: 4,
      generatedRevenue: 30900,
      collectedRevenue: 24000,
      outstandingRevenue: 6900,
      directCost: 8830,
      grossProfit: 22070,
    },
    '2026-10': {
      orderCount: 6,
      completedOrderCount: 3,
      paidOrderCount: 2,
      generatedRevenue: 20150,
      collectedRevenue: 10550,
      outstandingRevenue: 9600,
      directCost: 5170,
      grossProfit: 14980,
    },
  } satisfies Record<string, DemoMonthlyExpectation>,
} as const;
