import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { normalizeAndValidateSchemaName, quoteIdentifier } from '../schema-name';

export interface TenantMigration {
  readonly version: number;
  readonly name: string;
  up(queryRunner: QueryRunner, schemaName: string): Promise<void>;
}

export const TENANT_BASE_VERSION = 6;
export const TENANT_BASE_NAME = 'tenant-base';

/**
 * Dynamic tenant migrations deliberately use qualified identifiers everywhere.
 * Monetary numeric values are returned by pg as strings and remain strings at the API boundary.
 */
@Injectable()
export class TenantMigrator {
  async migrateBase(queryRunner: QueryRunner, rawSchemaName: string): Promise<void> {
    const schemaName = normalizeAndValidateSchemaName(rawSchemaName);
    const s = quoteIdentifier(schemaName);

    const statements = this.baseStatements(s);
    for (const statement of statements) await queryRunner.query(statement);
  }

  baseStatements(s: string): string[] {
    return [
      `CREATE TABLE ${s}.customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_type varchar(10) NOT NULL DEFAULT 'person'
          CHECK (customer_type IN ('person', 'company')),
        display_name varchar(180) NOT NULL,
        legal_name varchar(180), contact_name varchar(180),
        tax_id varchar(20), email citext, phone varchar(30), notes text,
        is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tax_id),
        CHECK (
          customer_type = 'company' OR
          (legal_name IS NULL AND contact_name IS NULL)
        )
      )`,
      `CREATE INDEX customers_display_name_idx ON ${s}.customers (lower(display_name))`,
      `CREATE TABLE ${s}.vehicles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES ${s}.customers(id) ON DELETE RESTRICT,
        brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id),
        model_id uuid NOT NULL REFERENCES public.vehicle_models(id),
        serial_number varchar(10), license_plate varchar(20), model_year smallint NOT NULL,
        color varchar(50) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (customer_id, brand_id, serial_number),
        CHECK (serial_number IS NULL OR serial_number ~ '^[A-HJ-NPR-Z0-9]{10}$'),
        CHECK (model_year BETWEEN 1886 AND 2200),
        CHECK (char_length(trim(color)) BETWEEN 1 AND 50)
      )`,
      `CREATE INDEX vehicles_serial_number_idx ON ${s}.vehicles (serial_number)
       WHERE serial_number IS NOT NULL`,
      `CREATE TABLE ${s}.measurement_units (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(80) NOT NULL, symbol varchar(20) NOT NULL, sat_code varchar(3),
        allows_decimals boolean NOT NULL DEFAULT true, is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid REFERENCES public.users(id),
        updated_by_user_id uuid REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
        CHECK (char_length(trim(symbol)) BETWEEN 1 AND 20),
        CHECK (sat_code IS NULL OR sat_code ~ '^[A-Z0-9]{1,3}$')
      )`,
      `CREATE UNIQUE INDEX measurement_units_name_unique ON ${s}.measurement_units(lower(name))`,
      `CREATE UNIQUE INDEX measurement_units_symbol_unique ON ${s}.measurement_units(lower(symbol))`,
      `INSERT INTO ${s}.measurement_units(name, symbol, sat_code, allows_decimals) VALUES
        ('Pieza', 'pza', 'H87', false), ('Servicio', 'serv', 'E48', true),
        ('Litro', 'L', 'LTR', true), ('Hora', 'h', 'HUR', true)`,
      `CREATE TABLE ${s}.products_services (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind varchar(10) NOT NULL CHECK (kind IN ('product','service')),
        sku varchar(80), name varchar(180) NOT NULL, description text,
        unit_id uuid NOT NULL REFERENCES ${s}.measurement_units(id),
        sat_product_service_code varchar(8)
          CHECK (sat_product_service_code IS NULL OR sat_product_service_code ~ '^[0-9]{8}$'),
        unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
        cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
        tracks_inventory boolean NOT NULL DEFAULT false CHECK (kind = 'product' OR tracks_inventory = false),
        is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (char_length(trim(name)) BETWEEN 1 AND 180)
      )`,
      `CREATE UNIQUE INDEX products_services_sku_unique
       ON ${s}.products_services(lower(sku)) WHERE sku IS NOT NULL`,
      `CREATE INDEX products_services_name_idx ON ${s}.products_services(lower(name))`,
      `CREATE TABLE ${s}.orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        folio bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
        customer_id uuid NOT NULL REFERENCES ${s}.customers(id),
        vehicle_id uuid NOT NULL REFERENCES ${s}.vehicles(id),
        status varchar(24) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','cancelled')),
        opened_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz,
        subtotal numeric(14,2), tax numeric(14,2) NOT NULL DEFAULT 0,
        total numeric(14,2) CHECK (total >= 0), is_paid boolean NOT NULL DEFAULT false,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        updated_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX orders_status_opened_idx ON ${s}.orders(status, opened_at DESC)`,
      `CREATE INDEX orders_customer_created_idx ON ${s}.orders(customer_id, created_at DESC)`,
      `CREATE INDEX orders_vehicle_created_idx ON ${s}.orders(vehicle_id, created_at DESC)`,
      `CREATE TABLE ${s}.order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES ${s}.orders(id) ON DELETE CASCADE,
        product_service_id uuid REFERENCES ${s}.products_services(id),
        description varchar(300) NOT NULL, quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
        unit_price numeric(14,2) CHECK (unit_price >= 0), total numeric(14,2) CHECK (total >= 0),
        position integer NOT NULL CHECK (position > 0), created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(order_id, position)
      )`,
      `CREATE TABLE ${s}.order_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES ${s}.orders(id) ON DELETE CASCADE,
        body text NOT NULL CHECK (length(trim(body)) > 0),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id), created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.order_status_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES ${s}.orders(id) ON DELETE CASCADE,
        previous_status varchar(24),
        new_status varchar(24) NOT NULL CHECK (new_status IN ('in_progress','completed','cancelled')),
        changed_by_user_id uuid NOT NULL REFERENCES public.users(id),
        changed_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX order_status_history_order_date_idx ON ${s}.order_status_history(order_id, changed_at, id)`,
      `CREATE TABLE ${s}.suppliers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(180) NOT NULL UNIQUE,
        tax_id varchar(20), email citext, phone varchar(30), is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.purchases (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), folio bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
        supplier_id uuid NOT NULL REFERENCES ${s}.suppliers(id),
        status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','cancelled')),
        purchased_at timestamptz NOT NULL DEFAULT now(), total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.purchase_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), purchase_id uuid NOT NULL REFERENCES ${s}.purchases(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES ${s}.products_services(id),
        quantity numeric(12,3) NOT NULL CHECK (quantity > 0), unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
        total numeric(14,2) NOT NULL CHECK (total >= 0)
      )`,
      `CREATE TABLE ${s}.inventory_lots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES ${s}.products_services(id),
        purchase_item_id uuid REFERENCES ${s}.purchase_items(id),
        received_quantity numeric(12,3) NOT NULL CHECK (received_quantity > 0),
        remaining_quantity numeric(12,3) NOT NULL CHECK (remaining_quantity >= 0),
        unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0), received_at timestamptz NOT NULL DEFAULT now(),
        CHECK (remaining_quantity <= received_quantity)
      )`,
      `CREATE INDEX inventory_lots_fifo_idx ON ${s}.inventory_lots(product_id, received_at, id) WHERE remaining_quantity > 0`,
      `CREATE TABLE ${s}.inventory_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES ${s}.products_services(id),
        lot_id uuid REFERENCES ${s}.inventory_lots(id), order_item_id uuid REFERENCES ${s}.order_items(id),
        movement_type varchar(20) NOT NULL CHECK (movement_type IN ('purchase','sale','adjustment','return')),
        quantity numeric(12,3) NOT NULL CHECK (quantity <> 0), unit_cost numeric(14,2), reason varchar(250),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id), created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX inventory_movements_product_date_idx ON ${s}.inventory_movements(product_id, created_at DESC)`,
      `CREATE TABLE ${s}.quotes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), folio bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
        customer_id uuid NOT NULL REFERENCES ${s}.customers(id), vehicle_id uuid REFERENCES ${s}.vehicles(id),
        status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
        valid_until date, subtotal numeric(14,2) NOT NULL DEFAULT 0, tax numeric(14,2) NOT NULL DEFAULT 0,
        total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.quote_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id uuid NOT NULL REFERENCES ${s}.quotes(id) ON DELETE CASCADE,
        product_service_id uuid REFERENCES ${s}.products_services(id), description varchar(300) NOT NULL,
        quantity numeric(12,3) NOT NULL CHECK (quantity > 0), unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
        total numeric(14,2) NOT NULL CHECK (total >= 0)
      )`,
      `CREATE TABLE ${s}.expense_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid NOT NULL REFERENCES ${s}.expense_categories(id),
        description varchar(250) NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount > 0),
        occurred_on date NOT NULL, supplier_id uuid REFERENCES ${s}.suppliers(id),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX expenses_occurred_on_idx ON ${s}.expenses(occurred_on DESC)`,
      `CREATE TABLE ${s}.employees (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
        full_name varchar(180) NOT NULL, email citext, phone varchar(30), hired_on date NOT NULL,
        base_salary numeric(14,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0), is_active boolean NOT NULL DEFAULT true,
        created_by_user_id uuid NOT NULL REFERENCES public.users(id),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE ${s}.payroll_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), starts_on date NOT NULL, ends_on date NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id), created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (ends_on >= starts_on), UNIQUE(starts_on, ends_on)
      )`,
      `CREATE TABLE ${s}.payroll_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), period_id uuid NOT NULL REFERENCES ${s}.payroll_periods(id) ON DELETE CASCADE,
        employee_id uuid NOT NULL REFERENCES ${s}.employees(id),
        movement_type varchar(20) NOT NULL CHECK (movement_type IN ('earning','deduction')),
        concept varchar(180) NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount > 0),
        created_by_user_id uuid NOT NULL REFERENCES public.users(id), created_at timestamptz NOT NULL DEFAULT now()
      )`,
    ];
  }
}
