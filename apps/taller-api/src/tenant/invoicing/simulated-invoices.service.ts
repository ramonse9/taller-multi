import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { quoteIdentifier } from '../../database/schema-name';
import { TenantSessionService } from '../tenant-session.service';
import {
  CreateSimulatedInvoiceDto,
  FiscalCatalogEntryDto,
  PaginatedSimulatedInvoicesResponseDto,
  SimulatedInvoiceCatalogsResponseDto,
  SimulatedInvoiceEventResponseDto,
  SimulatedInvoiceItemResponseDto,
  SimulatedInvoiceQueryDto,
  SimulatedInvoiceResponseDto,
  SimulatedInvoiceStatus,
  SimulatedInvoiceTaxInputDto,
  TaxRateCatalogEntryDto,
  UpdateSimulatedInvoiceDto,
} from './dto/simulated-invoice.dto';

interface SettingsRow {
  mode: string;
  fiscal_name: string | null;
  tax_id: string | null;
  fiscal_regime_code: string | null;
  fiscal_postal_code: string | null;
  default_series: string;
  next_internal_folio: string;
  prices_include_tax: boolean | null;
  is_active: boolean;
}

interface OrderFiscalRow {
  id: string;
  folio: string;
  status: string;
  customer_type: 'person' | 'company';
  fiscal_name: string | null;
  tax_id: string | null;
  fiscal_postal_code: string | null;
  fiscal_regime_code: string | null;
  preferred_cfdi_use_code: string | null;
}

interface OrderItemSourceRow {
  id: string;
  position: number;
  description: string;
  quantity: string;
  unit_price: string;
  unit_name: string;
  product_service_code: string | null;
  unit_code: string | null;
}

interface InvoiceRow {
  id: string;
  order_id: string;
  order_folio: string;
  status: SimulatedInvoiceStatus;
  series: string | null;
  folio: string | null;
  issuer_fiscal_name: string;
  issuer_tax_id: string;
  issuer_fiscal_regime_code: string;
  issuer_postal_code: string;
  receiver_fiscal_name: string;
  receiver_tax_id: string;
  receiver_fiscal_regime_code: string;
  receiver_postal_code: string;
  cfdi_use_code: string;
  payment_form_code: string;
  payment_method_code: string;
  export_code: string;
  currency_code: 'MXN';
  prices_include_tax: boolean;
  subtotal: string;
  transferred_tax: string;
  total: string;
  issued_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface InvoiceItemRow {
  id: string;
  order_item_id: string | null;
  position: number;
  description: string;
  product_service_code: string | null;
  unit_code: string | null;
  unit_name: string;
  quantity: string;
  unit_price: string;
  tax_object_code: string;
  tax_code: string | null;
  factor_type_code: string | null;
  tax_rate: string | null;
  base_amount: string;
  tax_amount: string;
  total: string;
}

@Injectable()
export class SimulatedInvoicesService {
  constructor(private readonly tenant: TenantSessionService) {}

  catalogs(user: AuthenticatedUser): Promise<SimulatedInvoiceCatalogsResponseDto> {
    return this.tenant.run(user, async (runner) => ({
      cfdiUses: await this.cfdiUses(runner),
      taxObjects: await this.catalog(runner, 'sat_tax_objects'),
      taxes: await this.catalog(runner, 'sat_taxes'),
      factorTypes: await this.catalog(runner, 'sat_factor_types'),
      taxRates: await this.taxRates(runner),
      paymentForms: await this.catalog(runner, 'sat_payment_forms'),
      paymentMethods: await this.catalog(runner, 'sat_payment_methods'),
      exportCodes: await this.catalog(runner, 'sat_export_codes'),
    }));
  }

  list(
    user: AuthenticatedUser,
    query: SimulatedInvoiceQueryDto,
  ): Promise<PaginatedSimulatedInvoicesResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const count = (await runner.query(
        `SELECT count(*)::int AS total FROM ${schema}.simulated_invoices
         WHERE ($1::varchar IS NULL OR status = $1)`,
        [query.status ?? null],
      )) as Array<{ total: number }>;
      const totalItems = count[0]?.total ?? 0;
      const offset = (query.page - 1) * query.limit;
      const ids = (await runner.query(
        `SELECT id FROM ${schema}.simulated_invoices
         WHERE ($1::varchar IS NULL OR status = $1)
         ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3`,
        [query.status ?? null, query.limit, offset],
      )) as Array<{ id: string }>;
      const items: SimulatedInvoiceResponseDto[] = [];
      for (const { id } of ids) items.push(await this.getInvoice(runner, schema, id));
      return {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
        hasNextPage: offset + items.length < totalItems,
        items,
      };
    });
  }

  getOne(user: AuthenticatedUser, id: string): Promise<SimulatedInvoiceResponseDto> {
    return this.tenant.run(user, (runner, schemaName) =>
      this.getInvoice(runner, quoteIdentifier(schemaName), id),
    );
  }

  create(
    user: AuthenticatedUser,
    input: CreateSimulatedInvoiceDto,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.tenant
      .run(user, async (runner, schemaName) => {
        const schema = quoteIdentifier(schemaName);
        const settings = await this.requireSimulationReady(runner, schema, true);
        const order = await this.findOrder(runner, schema, input.orderId);
        this.assertOrderReady(order);
        await this.validateHeaderCatalogs(runner, order, input);
        const sourceItems = await this.orderItems(runner, schema, input.orderId);
        if (sourceItems.length === 0) {
          throw new UnprocessableEntityException(
            'La orden no tiene conceptos cobrables para simular',
          );
        }
        const rows = (await runner.query(
          `INSERT INTO ${schema}.simulated_invoices(
           order_id, issuer_fiscal_name, issuer_tax_id, issuer_fiscal_regime_code,
           issuer_postal_code, receiver_fiscal_name, receiver_tax_id,
           receiver_fiscal_regime_code, receiver_postal_code, cfdi_use_code,
           payment_form_code, payment_method_code, export_code, prices_include_tax,
           created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
         RETURNING id`,
          [
            order.id,
            settings.fiscal_name,
            settings.tax_id,
            settings.fiscal_regime_code,
            settings.fiscal_postal_code,
            order.fiscal_name,
            order.tax_id,
            order.fiscal_regime_code,
            order.fiscal_postal_code,
            input.cfdiUseCode,
            input.paymentFormCode,
            input.paymentMethodCode,
            input.exportCode,
            settings.prices_include_tax,
            user.id,
          ],
        )) as Array<{ id: string }>;
        const invoiceId = rows[0]!.id;
        await this.replaceItems(
          runner,
          schema,
          invoiceId,
          sourceItems,
          input.items ?? [],
          settings.prices_include_tax!,
        );
        await this.recalculate(runner, schema, invoiceId, user.id);
        await this.event(runner, schema, invoiceId, 'created', { orderId: order.id }, user.id);
        return this.getInvoice(runner, schema, invoiceId);
      })
      .catch((error: unknown) => {
        const databaseError = error as { code?: string; driverError?: { code?: string } };
        if (databaseError.code === '23505' || databaseError.driverError?.code === '23505') {
          throw new ConflictException('La orden ya tiene una simulación activa');
        }
        throw error;
      });
  }

  update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateSimulatedInvoiceDto,
  ): Promise<SimulatedInvoiceResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      await this.requireSimulationReady(runner, schema);
      const current = await this.lockInvoice(runner, schema, id);
      if (current.status !== SimulatedInvoiceStatus.Draft) {
        throw new BadRequestException('Solamente se pueden editar borradores');
      }
      const order = await this.findOrder(runner, schema, current.order_id);
      const merged = {
        cfdiUseCode: input.cfdiUseCode ?? current.cfdi_use_code,
        paymentFormCode: input.paymentFormCode ?? current.payment_form_code,
        paymentMethodCode: input.paymentMethodCode ?? current.payment_method_code,
        exportCode: input.exportCode ?? current.export_code,
      };
      await this.validateHeaderCatalogs(runner, order, merged);
      await runner.query(
        `UPDATE ${schema}.simulated_invoices SET cfdi_use_code=$2, payment_form_code=$3,
         payment_method_code=$4, export_code=$5, updated_by_user_id=$6, updated_at=now()
         WHERE id=$1`,
        [
          id,
          merged.cfdiUseCode,
          merged.paymentFormCode,
          merged.paymentMethodCode,
          merged.exportCode,
          user.id,
        ],
      );
      if (input.items) {
        const sourceItems = await this.orderItems(runner, schema, current.order_id);
        await this.replaceItems(
          runner,
          schema,
          id,
          sourceItems,
          input.items,
          current.prices_include_tax,
        );
      }
      await this.recalculate(runner, schema, id, user.id);
      await this.event(runner, schema, id, 'updated', { fields: Object.keys(input) }, user.id);
      return this.getInvoice(runner, schema, id);
    });
  }

  issue(user: AuthenticatedUser, id: string): Promise<SimulatedInvoiceResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      const settings = await this.requireSimulationReady(runner, schema, true);
      const invoice = await this.lockInvoice(runner, schema, id);
      if (invoice.status !== SimulatedInvoiceStatus.Draft) {
        throw new BadRequestException('La simulación ya fue emitida o cancelada');
      }
      const order = await this.findOrder(runner, schema, invoice.order_id);
      this.assertOrderReady(order);
      await this.validateHeaderCatalogs(runner, order, {
        cfdiUseCode: invoice.cfdi_use_code,
        paymentFormCode: invoice.payment_form_code,
        paymentMethodCode: invoice.payment_method_code,
        exportCode: invoice.export_code,
      });
      await runner.query(
        `UPDATE ${schema}.simulated_invoices SET status='issued', series=$2, folio=$3,
           issued_at=now(), issued_by_user_id=$4, updated_by_user_id=$4, updated_at=now()
         WHERE id=$1`,
        [id, settings.default_series, Number(settings.next_internal_folio), user.id],
      );
      await runner.query(
        `UPDATE ${schema}.invoice_settings SET next_internal_folio=next_internal_folio+1,
         updated_by_user_id=$1, updated_at=now() WHERE id=1`,
        [user.id],
      );
      await this.event(
        runner,
        schema,
        id,
        'issued',
        { label: 'Simulación sin validez fiscal' },
        user.id,
      );
      return this.getInvoice(runner, schema, id);
    });
  }

  cancel(user: AuthenticatedUser, id: string): Promise<SimulatedInvoiceResponseDto> {
    return this.tenant.run(user, async (runner, schemaName) => {
      const schema = quoteIdentifier(schemaName);
      await this.requireSimulationReady(runner, schema);
      const invoice = await this.lockInvoice(runner, schema, id);
      if (invoice.status !== SimulatedInvoiceStatus.Issued) {
        throw new BadRequestException('Solamente una simulación emitida puede cancelarse');
      }
      await runner.query(
        `UPDATE ${schema}.simulated_invoices SET status='cancelled', cancelled_at=now(),
         cancelled_by_user_id=$2, updated_by_user_id=$2, updated_at=now() WHERE id=$1`,
        [id, user.id],
      );
      await this.event(runner, schema, id, 'cancelled', {}, user.id);
      return this.getInvoice(runner, schema, id);
    });
  }

  private async requireSimulationReady(
    runner: QueryRunner,
    schema: string,
    lock = false,
  ): Promise<SettingsRow> {
    const rows = (await runner.query(
      `SELECT mode, fiscal_name, tax_id, fiscal_regime_code, fiscal_postal_code,
              default_series, next_internal_folio::text, prices_include_tax, is_active
       FROM ${schema}.invoice_settings WHERE id=1${lock ? ' FOR UPDATE' : ''}`,
    )) as SettingsRow[];
    const row = rows[0];
    if (!row || row.mode !== 'simulation') {
      throw new UnprocessableEntityException('El modo de simulación no está habilitado');
    }
    if (!row.is_active) throw new UnprocessableEntityException('La facturación está inactiva');
    if (
      !row.fiscal_name ||
      !row.tax_id ||
      !row.fiscal_regime_code ||
      !row.fiscal_postal_code ||
      row.prices_include_tax === null
    ) {
      throw new UnprocessableEntityException(
        'Completa la configuración fiscal del emisor antes de crear simulaciones',
      );
    }
    return row;
  }

  private async findOrder(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<OrderFiscalRow> {
    const rows = (await runner.query(
      `SELECT service_order.id, service_order.folio::text, service_order.status,
              customer.customer_type, customer.fiscal_name, customer.tax_id,
              customer.fiscal_postal_code, customer.fiscal_regime_code,
              customer.preferred_cfdi_use_code
       FROM ${schema}.orders service_order
       JOIN ${schema}.customers customer ON customer.id=service_order.customer_id
       WHERE service_order.id=$1`,
      [id],
    )) as OrderFiscalRow[];
    if (!rows[0]) throw new NotFoundException('Orden no encontrada');
    return rows[0];
  }

  private assertOrderReady(order: OrderFiscalRow): void {
    if (order.status !== 'completed') {
      throw new UnprocessableEntityException('La orden debe estar terminada para facturarla');
    }
    if (
      !order.fiscal_name ||
      !order.tax_id ||
      !order.fiscal_postal_code ||
      !order.fiscal_regime_code
    ) {
      throw new UnprocessableEntityException(
        'El cliente no tiene completo su perfil fiscal para facturación',
      );
    }
  }

  private async validateHeaderCatalogs(
    runner: QueryRunner,
    order: OrderFiscalRow,
    input: {
      cfdiUseCode: string;
      paymentFormCode: string;
      paymentMethodCode: string;
      exportCode: string;
    },
  ): Promise<void> {
    const uses = (await runner.query(
      `SELECT EXISTS(
         SELECT 1 FROM public.sat_cfdi_uses use_code
         JOIN public.sat_cfdi_use_fiscal_regimes compatibility
           ON compatibility.cfdi_use_code=use_code.code
         WHERE use_code.code=$1 AND use_code.is_active=true
           AND compatibility.fiscal_regime_code=$2
           AND (($3='person' AND use_code.supports_person) OR
                ($3='company' AND use_code.supports_company))
       ) AS valid`,
      [input.cfdiUseCode, order.fiscal_regime_code, order.customer_type],
    )) as Array<{ valid: boolean }>;
    if (!uses[0]?.valid)
      throw new BadRequestException('El Uso CFDI no es compatible con el receptor');
    await this.assertSupportedCatalog(
      runner,
      'sat_payment_forms',
      input.paymentFormCode,
      'forma de pago',
    );
    await this.assertSupportedCatalog(
      runner,
      'sat_payment_methods',
      input.paymentMethodCode,
      'método de pago',
    );
    await this.assertSupportedCatalog(
      runner,
      'sat_export_codes',
      input.exportCode,
      'clave de exportación',
    );
    if (input.paymentMethodCode === 'PPD' && input.paymentFormCode !== '99') {
      throw new BadRequestException('PPD requiere la forma de pago 99 · Por definir');
    }
    if (input.paymentMethodCode === 'PUE' && input.paymentFormCode === '99') {
      throw new BadRequestException('PUE requiere una forma de pago distinta de 99');
    }
  }

  private async orderItems(
    runner: QueryRunner,
    schema: string,
    orderId: string,
  ): Promise<OrderItemSourceRow[]> {
    return (await runner.query(
      `SELECT item.id, item.position, item.description, item.quantity::text,
              item.unit_price::text, item.unit_name,
              concept.sat_product_service_code AS product_service_code,
              unit.sat_code AS unit_code
       FROM ${schema}.order_items item
       LEFT JOIN ${schema}.products_services concept ON concept.id=item.product_service_id
       LEFT JOIN ${schema}.measurement_units unit ON unit.id=concept.unit_id
       WHERE item.order_id=$1 AND item.affects_order_total=true AND item.unit_price IS NOT NULL
       ORDER BY item.position, item.id`,
      [orderId],
    )) as OrderItemSourceRow[];
  }

  private async replaceItems(
    runner: QueryRunner,
    schema: string,
    invoiceId: string,
    sourceItems: OrderItemSourceRow[],
    taxes: SimulatedInvoiceTaxInputDto[],
    pricesIncludeTax: boolean,
  ): Promise<void> {
    const taxByItem = new Map(taxes.map((tax) => [tax.orderItemId, tax]));
    const unknown = taxes.find((tax) => !sourceItems.some((item) => item.id === tax.orderItemId));
    if (unknown) throw new BadRequestException('Un concepto fiscal no pertenece a la orden');
    await runner.query(`DELETE FROM ${schema}.simulated_invoice_items WHERE invoice_id=$1`, [
      invoiceId,
    ]);
    for (const item of sourceItems) {
      const selection = taxByItem.get(item.id) ?? {
        orderItemId: item.id,
        taxObjectCode: '02' as const,
        taxCode: '002',
        factorTypeCode: 'Tasa' as const,
        taxRate: 0.16,
      };
      const tax = await this.normalizeTax(runner, selection);
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const amount = this.round(quantity * unitPrice);
      const rate = tax.rate ?? 0;
      const base =
        tax.objectCode === '02' && pricesIncludeTax && rate > 0
          ? this.round(amount / (1 + rate))
          : amount;
      const taxAmount = tax.objectCode === '02' ? this.round(base * rate) : 0;
      const total = pricesIncludeTax ? amount : this.round(base + taxAmount);
      await runner.query(
        `INSERT INTO ${schema}.simulated_invoice_items(
           invoice_id, order_item_id, position, description, product_service_code,
           unit_code, unit_name, quantity, unit_price, tax_object_code, tax_code,
           factor_type_code, tax_rate, base_amount, tax_amount, total
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          invoiceId,
          item.id,
          item.position,
          item.description,
          item.product_service_code,
          item.unit_code,
          item.unit_name,
          quantity,
          unitPrice,
          tax.objectCode,
          tax.taxCode,
          tax.factorType,
          tax.rate,
          base,
          taxAmount,
          total,
        ],
      );
    }
  }

  private async normalizeTax(
    runner: QueryRunner,
    input: SimulatedInvoiceTaxInputDto,
  ): Promise<{
    objectCode: string;
    taxCode: string | null;
    factorType: string | null;
    rate: number | null;
  }> {
    await this.assertSupportedCatalog(
      runner,
      'sat_tax_objects',
      input.taxObjectCode,
      'objeto de impuesto',
    );
    if (input.taxObjectCode === '01') {
      return { objectCode: '01', taxCode: null, factorType: null, rate: null };
    }
    const taxCode = input.taxCode ?? '002';
    const factorType = input.factorTypeCode ?? 'Tasa';
    const rate = factorType === 'Exento' ? null : (input.taxRate ?? 0.16);
    const rows = (await runner.query(
      `SELECT EXISTS(
        SELECT 1 FROM public.sat_tax_rates
        WHERE tax_code=$1 AND factor_type_code=$2
          AND (($3::numeric IS NULL AND rate IS NULL) OR rate=$3)
          AND is_active=true AND simulation_supported=true
      ) AS valid`,
      [taxCode, factorType, rate],
    )) as Array<{ valid: boolean }>;
    if (!rows[0]?.valid) {
      throw new BadRequestException('La combinación de impuesto, factor y tasa no está soportada');
    }
    return { objectCode: '02', taxCode, factorType, rate };
  }

  private async assertSupportedCatalog(
    runner: QueryRunner,
    table: string,
    code: string,
    label: string,
  ): Promise<void> {
    const allowed = new Set([
      'sat_tax_objects',
      'sat_payment_forms',
      'sat_payment_methods',
      'sat_export_codes',
    ]);
    if (!allowed.has(table)) throw new Error('Catálogo fiscal no permitido');
    const rows = (await runner.query(
      `SELECT EXISTS(SELECT 1 FROM public.${table}
       WHERE code=$1 AND is_active=true AND simulation_supported=true) AS valid`,
      [code],
    )) as Array<{ valid: boolean }>;
    if (!rows[0]?.valid) throw new BadRequestException(`La ${label} no existe o no está soportada`);
  }

  private async recalculate(
    runner: QueryRunner,
    schema: string,
    id: string,
    userId: string,
  ): Promise<void> {
    await runner.query(
      `UPDATE ${schema}.simulated_invoices invoice SET
         subtotal=totals.subtotal, transferred_tax=totals.tax, total=totals.total,
         updated_by_user_id=$2, updated_at=now()
       FROM (
         SELECT invoice_id, round(sum(base_amount),2) AS subtotal,
                round(sum(tax_amount),2) AS tax, round(sum(total),2) AS total
         FROM ${schema}.simulated_invoice_items WHERE invoice_id=$1 GROUP BY invoice_id
       ) totals WHERE invoice.id=$1 AND totals.invoice_id=invoice.id`,
      [id, userId],
    );
  }

  private async lockInvoice(runner: QueryRunner, schema: string, id: string): Promise<InvoiceRow> {
    const rows = (await runner.query(
      `${this.invoiceSelect(schema)} WHERE invoice.id=$1 FOR UPDATE OF invoice`,
      [id],
    )) as InvoiceRow[];
    if (!rows[0]) throw new NotFoundException('Simulación no encontrada');
    return rows[0];
  }

  private async getInvoice(
    runner: QueryRunner,
    schema: string,
    id: string,
  ): Promise<SimulatedInvoiceResponseDto> {
    const rows = (await runner.query(`${this.invoiceSelect(schema)} WHERE invoice.id=$1`, [
      id,
    ])) as InvoiceRow[];
    const row = rows[0];
    if (!row) throw new NotFoundException('Simulación no encontrada');
    const itemRows = (await runner.query(
      `SELECT id, order_item_id, position, description, product_service_code, unit_code,
              unit_name, quantity::text, unit_price::text, tax_object_code, tax_code,
              factor_type_code, tax_rate::text, base_amount::text, tax_amount::text, total::text
       FROM ${schema}.simulated_invoice_items WHERE invoice_id=$1 ORDER BY position,id`,
      [id],
    )) as InvoiceItemRow[];
    const eventRows = (await runner.query(
      `SELECT event.id, event.event_type, event.details, event.actor_user_id,
              platform_user.full_name AS actor_name, event.created_at
       FROM ${schema}.simulated_invoice_events event
       JOIN public.users platform_user ON platform_user.id=event.actor_user_id
       WHERE event.invoice_id=$1 ORDER BY event.created_at,event.id`,
      [id],
    )) as Array<{
      id: string;
      event_type: string;
      details: Record<string, unknown>;
      actor_user_id: string;
      actor_name: string;
      created_at: Date;
    }>;
    return this.toResponse(row, itemRows, eventRows);
  }

  private invoiceSelect(schema: string): string {
    return `SELECT invoice.*, service_order.folio::text AS order_folio
      FROM ${schema}.simulated_invoices invoice
      JOIN ${schema}.orders service_order ON service_order.id=invoice.order_id`;
  }

  private async event(
    runner: QueryRunner,
    schema: string,
    id: string,
    type: string,
    details: Record<string, unknown>,
    actorId: string,
  ): Promise<void> {
    await runner.query(
      `INSERT INTO ${schema}.simulated_invoice_events(invoice_id,event_type,details,actor_user_id)
       VALUES ($1,$2,$3,$4)`,
      [id, type, details, actorId],
    );
  }

  private async catalog(runner: QueryRunner, table: string): Promise<FiscalCatalogEntryDto[]> {
    const allowed = new Set([
      'sat_tax_objects',
      'sat_taxes',
      'sat_factor_types',
      'sat_payment_forms',
      'sat_payment_methods',
      'sat_export_codes',
    ]);
    if (!allowed.has(table)) throw new Error('Catálogo fiscal no permitido');
    const rows = (await runner.query(
      `SELECT code, description, is_active, simulation_supported
       FROM public.${table} ORDER BY code`,
    )) as Array<{
      code: string;
      description: string;
      is_active: boolean;
      simulation_supported: boolean;
    }>;
    return rows.map((row) => ({
      code: row.code,
      description: row.description,
      isActive: row.is_active,
      simulationSupported: row.simulation_supported,
    }));
  }

  private async taxRates(runner: QueryRunner): Promise<TaxRateCatalogEntryDto[]> {
    const rows = (await runner.query(
      `SELECT id, tax_code, factor_type_code, rate::text, description,
              is_active, simulation_supported
       FROM public.sat_tax_rates ORDER BY tax_code, factor_type_code, rate NULLS LAST`,
    )) as Array<{
      id: string;
      tax_code: string;
      factor_type_code: string;
      rate: string | null;
      description: string;
      is_active: boolean;
      simulation_supported: boolean;
    }>;
    return rows.map((row) => ({
      id: row.id,
      taxCode: row.tax_code,
      factorTypeCode: row.factor_type_code,
      rate: row.rate,
      description: row.description,
      isActive: row.is_active,
      simulationSupported: row.simulation_supported,
    }));
  }

  private async cfdiUses(runner: QueryRunner): Promise<FiscalCatalogEntryDto[]> {
    const rows = (await runner.query(
      `SELECT code, description, is_active FROM public.sat_cfdi_uses ORDER BY code`,
    )) as Array<{ code: string; description: string; is_active: boolean }>;
    return rows.map((row) => ({
      code: row.code,
      description: row.description,
      isActive: row.is_active,
      simulationSupported: true,
    }));
  }

  private toResponse(
    row: InvoiceRow,
    items: InvoiceItemRow[],
    events: Array<{
      id: string;
      event_type: string;
      details: Record<string, unknown>;
      actor_user_id: string;
      actor_name: string;
      created_at: Date;
    }>,
  ): SimulatedInvoiceResponseDto {
    return {
      id: row.id,
      orderId: row.order_id,
      orderFolio: row.order_folio,
      status: row.status,
      series: row.series,
      folio: row.folio === null ? null : Number(row.folio),
      documentLabel: 'Simulación sin validez fiscal',
      issuerFiscalName: row.issuer_fiscal_name,
      issuerTaxId: row.issuer_tax_id,
      issuerFiscalRegimeCode: row.issuer_fiscal_regime_code,
      issuerPostalCode: row.issuer_postal_code,
      receiverFiscalName: row.receiver_fiscal_name,
      receiverTaxId: row.receiver_tax_id,
      receiverFiscalRegimeCode: row.receiver_fiscal_regime_code,
      receiverPostalCode: row.receiver_postal_code,
      cfdiUseCode: row.cfdi_use_code,
      paymentFormCode: row.payment_form_code,
      paymentMethodCode: row.payment_method_code,
      exportCode: row.export_code,
      currencyCode: row.currency_code,
      pricesIncludeTax: row.prices_include_tax,
      subtotal: row.subtotal,
      transferredTax: row.transferred_tax,
      total: row.total,
      issuedAt: row.issued_at,
      cancelledAt: row.cancelled_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: items.map((item): SimulatedInvoiceItemResponseDto => ({
        id: item.id,
        orderItemId: item.order_item_id,
        position: item.position,
        description: item.description,
        productServiceCode: item.product_service_code,
        unitCode: item.unit_code,
        unitName: item.unit_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        taxObjectCode: item.tax_object_code,
        taxCode: item.tax_code,
        factorTypeCode: item.factor_type_code,
        taxRate: item.tax_rate,
        baseAmount: item.base_amount,
        taxAmount: item.tax_amount,
        total: item.total,
      })),
      events: events.map((event): SimulatedInvoiceEventResponseDto => ({
        id: event.id,
        eventType: event.event_type,
        details: event.details,
        actorUserId: event.actor_user_id,
        actorName: event.actor_name,
        createdAt: event.created_at,
      })),
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
