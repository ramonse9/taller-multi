import { QueryRunner } from 'typeorm';
import { quotePostgresIdentifier } from './tenant-schema-name';

export const TENANT_SCHEMA_VERSION = 1;

/**
 * Creates the complete, non-billing tenant structure. Every object is schema
 * qualified so provisioning never depends on the connection search_path.
 */
export async function provisionTenantSchema(
  queryRunner: QueryRunner,
  schemaName: string,
): Promise<void> {
  const s = quotePostgresIdentifier(schemaName);

  const statements = [
    `CREATE SCHEMA ${s}`,
    `CREATE TABLE ${s}."_schema_migrations" (
      "version" integer PRIMARY KEY,
      "applied_at" timestamptz NOT NULL DEFAULT now()
    )`,

    `CREATE TYPE ${s}."pri_ordenes_estatus_enum" AS ENUM ('proceso', 'finalizado', 'pausado', 'cancelado')`,
    `CREATE TYPE ${s}."pri_ordenes_estatus_factura_enum" AS ENUM ('pendiente', 'timbrada')`,
    `CREATE TYPE ${s}."pri_ordenes_conceptos_tipo_enum" AS ENUM ('producto', 'servicio')`,
    `CREATE TYPE ${s}."pri_ordenes_conceptos_estatus_enum" AS ENUM ('vigente', 'cancelada')`,
    `CREATE TYPE ${s}."pri_gastos_movimientos_tipopago_enum" AS ENUM ('contado', 'credito')`,
    `CREATE TYPE ${s}."pri_nomina_periodos_periodicidad_enum" AS ENUM ('semanal', 'catorcenal_1', 'catorcenal_2', 'quincenal')`,
    `CREATE TYPE ${s}."pri_nomina_movimientos_detalles_tipo_enum" AS ENUM ('percepcion', 'deduccion')`,
    `CREATE TYPE ${s}."pri_nomina_movimientos_estatus_enum" AS ENUM ('activo', 'cancelado')`,
    `CREATE TYPE ${s}."pri_compras_estatus_enum" AS ENUM ('borrador', 'confirmada', 'cancelada')`,
    `CREATE TYPE ${s}."pri_inventario_movimientos_tipo_movimiento_enum" AS ENUM ('entrada', 'salida', 'ajuste')`,
    `CREATE TYPE ${s}."pri_inventario_movimientos_motivo_movimiento_enum" AS ENUM ('compra', 'orden_servicio', 'cancelacion', 'merma', 'ajuste_manual')`,

    `CREATE TABLE ${s}."pri_productos_servicios" (
      "id" varchar PRIMARY KEY,
      "descripcion" varchar NOT NULL,
      "valor_unitario" numeric(10,2) NOT NULL,
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_sat_producto_servicio" varchar REFERENCES public."pub_sat_productos_servicios"("id")
    )`,
    `CREATE TABLE ${s}."pri_clientes" (
      "id" varchar PRIMARY KEY,
      "nombre" varchar(50) NOT NULL,
      "telefono" varchar(10) NOT NULL,
      "email" varchar(40), "rfc" text, "razon_social" text, "codigo_postal" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "clave_sat_regimen_fiscal" varchar REFERENCES public."pub_sat_regimenes_fiscales"("clave"),
      "clave_sat_uso_cfdi" varchar REFERENCES public."pub_sat_uso_cfdi"("clave")
    )`,
    `CREATE TABLE ${s}."pri_empresas" (
      "id" varchar PRIMARY KEY,
      "nombre" varchar(70) NOT NULL,
      "telefono" varchar(10) NOT NULL,
      "email" varchar(40), "rfc" text, "razon_social" text, "codigo_postal" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "clave_sat_regimen_fiscal" varchar REFERENCES public."pub_sat_regimenes_fiscales"("clave"),
      "clave_sat_uso_cfdi" varchar REFERENCES public."pub_sat_uso_cfdi"("clave")
    )`,
    `CREATE TABLE ${s}."pri_vehiculos" (
      "id" varchar PRIMARY KEY, "anio" integer NOT NULL, "color" varchar(20) NOT NULL,
      "placa" varchar(15), "numero_serie" varchar(10) NOT NULL UNIQUE,
      "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_modelo" varchar REFERENCES public."pub_modelos"("id")
    )`,
    `CREATE TABLE ${s}."pri_productos" (
      "id" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "sku" varchar, "codigo_barras" varchar,
      "precio_venta" numeric(12,2) NOT NULL, "stock_actual" integer NOT NULL DEFAULT 0,
      "stock_minimo" integer NOT NULL DEFAULT 0, "permite_venta_sin_stock" boolean NOT NULL DEFAULT false,
      "activo" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_sat_producto_servicio" varchar REFERENCES public."pub_sat_productos_servicios"("id"),
      "id_producto_servicio_legacy" varchar REFERENCES ${s}."pri_productos_servicios"("id")
    )`,
    `CREATE TABLE ${s}."pri_servicios" (
      "id" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "precioVenta" numeric(12,2) NOT NULL,
      "activo" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_sat_producto_servicio" varchar REFERENCES public."pub_sat_productos_servicios"("id"),
      "id_producto_servicio_legacy" varchar REFERENCES ${s}."pri_productos_servicios"("id")
    )`,
    `CREATE TABLE ${s}."pri_ordenes" (
      "id" varchar PRIMARY KEY, "descripcion" text NOT NULL, "fecha_ingreso" timestamptz NOT NULL,
      "fecha_entrega_real" timestamptz, "fecha_pago" timestamptz, "pagada" boolean NOT NULL DEFAULT false,
      "kilometros" integer, "poliza" text, "siniestro" text,
      "estatus" ${s}."pri_ordenes_estatus_enum" NOT NULL DEFAULT 'proceso',
      "estatus_factura" ${s}."pri_ordenes_estatus_factura_enum" NOT NULL DEFAULT 'pendiente',
      "liquidacion_factura" boolean NOT NULL DEFAULT false, "fecha_liquidacion" timestamptz, "folio_nota" text,
      "subtotal_costo" numeric(12,2), "subtotal_venta" numeric(12,2), "utilidad" numeric(12,2),
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "clave_sat_metodo_pago" varchar REFERENCES public."pub_sat_metodos_pagos"("clave"),
      "id_vehiculo" varchar REFERENCES ${s}."pri_vehiculos"("id"),
      "id_cliente" varchar REFERENCES ${s}."pri_clientes"("id"),
      "id_empresa" varchar REFERENCES ${s}."pri_empresas"("id")
    )`,
    `CREATE TABLE ${s}."pri_ordenes_notas" (
      "id" serial PRIMARY KEY, "nota" varchar(1000) NOT NULL,
      "estatus" ${s}."pri_ordenes_estatus_enum", "createdAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_orden" varchar REFERENCES ${s}."pri_ordenes"("id") ON DELETE RESTRICT
    )`,
    `CREATE TABLE ${s}."pri_ordenes_notas_imagenes" (
      "id" serial PRIMARY KEY, "url" varchar NOT NULL, "public_id" varchar NOT NULL,
      "id_orden_nota" integer REFERENCES ${s}."pri_ordenes_notas"("id") ON DELETE RESTRICT
    )`,
    `CREATE TABLE ${s}."pri_ordenes_conceptos" (
      "id" serial PRIMARY KEY, "tipo" ${s}."pri_ordenes_conceptos_tipo_enum" NOT NULL,
      "cantidad" integer NOT NULL, "costo_unitario_promedio_snapshot" numeric(12,2),
      "subtotal_costo_snapshot" numeric(12,2), "precio_venta_snapshot" numeric(12,2),
      "subtotal_precio_venta_snapshot" numeric(12,2), "utilidad_snapshot" numeric(12,2),
      "estatus" ${s}."pri_ordenes_conceptos_estatus_enum" NOT NULL DEFAULT 'vigente',
      "id_producto_servicio" varchar REFERENCES ${s}."pri_productos_servicios"("id"),
      "id_producto" varchar REFERENCES ${s}."pri_productos"("id"),
      "id_servicio" varchar REFERENCES ${s}."pri_servicios"("id"),
      "id_orden" varchar REFERENCES ${s}."pri_ordenes"("id") ON DELETE RESTRICT
    )`,
    `CREATE TABLE ${s}."pri_cotizaciones" (
      "id" varchar PRIMARY KEY, "descripcion" text NOT NULL, "anio" integer,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_cliente" varchar REFERENCES ${s}."pri_clientes"("id"),
      "id_empresa" varchar REFERENCES ${s}."pri_empresas"("id"),
      "id_vehiculo" varchar REFERENCES ${s}."pri_vehiculos"("id"),
      "id_modelo" varchar REFERENCES public."pub_modelos"("id"),
      "id_orden" varchar REFERENCES ${s}."pri_ordenes"("id")
    )`,
    `CREATE TABLE ${s}."pri_cotizaciones_conceptos" (
      "id" serial PRIMARY KEY, "cantidad" integer NOT NULL, "valorUnitario" integer NOT NULL,
      "id_producto_servicio" varchar REFERENCES ${s}."pri_productos_servicios"("id"),
      "id_cotizacion" varchar REFERENCES ${s}."pri_cotizaciones"("id") ON DELETE RESTRICT
    )`,
    `CREATE TABLE ${s}."pri_gastos_categorias" (
      "id" serial PRIMARY KEY, "nombre" text NOT NULL UNIQUE, "descripcion" text,
      "activo" boolean NOT NULL DEFAULT true,
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id")
    )`,
    `INSERT INTO ${s}."pri_gastos_categorias" ("nombre", "descripcion", "activo") VALUES
      ('Servicios Básicos', 'Agua, luz, internet y teléfono', true),
      ('Telecomunicaciones', 'Telefonía y servicios digitales', true),
      ('Combustible', 'Gasolina y diésel', true),
      ('Herramientas y Equipo', 'Compra de herramienta y mantenimiento de equipo', true),
      ('Insumos y Materiales', 'Material de limpieza y consumibles', true),
      ('Gastos Administrativos', 'Papelería, licencias, trámites y contabilidad', true),
      ('Renta y Local', 'Renta, mantenimiento y seguridad', true),
      ('Mantenimiento Vehículos del Taller', 'Refacciones y reparaciones internas', true),
      ('Publicidad y Marketing', 'Publicidad, redes sociales e impresos', true)`,
    `CREATE TABLE ${s}."pri_gastos" (
      "id" varchar PRIMARY KEY, "nombre" varchar(50) NOT NULL,
      "recurrente" boolean NOT NULL DEFAULT false, "activo" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_gasto_categoria" integer REFERENCES ${s}."pri_gastos_categorias"("id")
    )`,
    `CREATE TABLE ${s}."pri_gastos_movimientos" (
      "id" varchar PRIMARY KEY, "monto" numeric(10,2) NOT NULL, "fecha" timestamptz NOT NULL,
      "tipoPago" ${s}."pri_gastos_movimientos_tipopago_enum" NOT NULL DEFAULT 'contado', "referencia" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_gasto" varchar REFERENCES ${s}."pri_gastos"("id")
    )`,
    `CREATE TABLE ${s}."pri_nomina_periodos" (
      "id" serial PRIMARY KEY, "anio" integer NOT NULL,
      "periodicidad" ${s}."pri_nomina_periodos_periodicidad_enum" NOT NULL DEFAULT 'semanal',
      "nombre" text NOT NULL, "fecha_inicio" date NOT NULL, "fecha_fin" date NOT NULL,
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id")
    )`,
    `CREATE TABLE ${s}."pri_empleados" (
      "id" varchar PRIMARY KEY, "nombre" text NOT NULL, "salario_base" numeric(10,2) NOT NULL,
      "activo" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id")
    )`,
    `CREATE TABLE ${s}."pri_nomina_movimientos" (
      "id" varchar PRIMARY KEY, "salario_base" numeric(10,2) NOT NULL,
      "total_percepciones" numeric(12,2) NOT NULL DEFAULT 0,
      "total_deducciones" numeric(12,2) NOT NULL DEFAULT 0, "total_neto" numeric(12,2) NOT NULL DEFAULT 0,
      "fecha" date, "estatus" ${s}."pri_nomina_movimientos_estatus_enum" NOT NULL DEFAULT 'activo',
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_empleado" varchar NOT NULL REFERENCES ${s}."pri_empleados"("id"),
      "id_periodo" integer NOT NULL REFERENCES ${s}."pri_nomina_periodos"("id")
    )`,
    `CREATE TABLE ${s}."pri_nomina_movimientos_detalles" (
      "id" serial PRIMARY KEY, "concepto" text NOT NULL, "monto" numeric(12,2) NOT NULL,
      "tipo" ${s}."pri_nomina_movimientos_detalles_tipo_enum" NOT NULL DEFAULT 'percepcion',
      "id_movimiento" varchar REFERENCES ${s}."pri_nomina_movimientos"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE ${s}."pri_proveedores" (
      "id" varchar PRIMARY KEY, "nombre" varchar NOT NULL, "rfc" varchar, "telefono" varchar,
      "email" varchar, "direccion" text, "contacto" varchar, "activo" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id")
    )`,
    `CREATE TABLE ${s}."pri_compras" (
      "id" varchar PRIMARY KEY, "subtotal" numeric(12,2) NOT NULL DEFAULT 0,
      "iva" numeric(12,2) NOT NULL DEFAULT 0, "total" numeric(12,2) NOT NULL DEFAULT 0,
      "estatus" ${s}."pri_compras_estatus_enum" NOT NULL DEFAULT 'borrador',
      "fecha_confirmacion" timestamptz, "fecha_cancelacion" timestamptz, "motivoCancelacion" text,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "createdAtUser" varchar REFERENCES public."pub_users"("id"),
      "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
      "id_proveedor" varchar REFERENCES ${s}."pri_proveedores"("id"),
      "id_user_borrador" varchar REFERENCES public."pub_users"("id"),
      "id_user_confirmacion" varchar REFERENCES public."pub_users"("id"),
      "id_user_cancelacion" varchar REFERENCES public."pub_users"("id")
    )`,
    `CREATE TABLE ${s}."pri_compras_detalle" (
      "id" serial PRIMARY KEY, "cantidad" numeric(12,3) NOT NULL, "costo_unitario" numeric(12,2) NOT NULL,
      "subtotal" numeric(12,2) NOT NULL,
      "id_compra" varchar REFERENCES ${s}."pri_compras"("id") ON DELETE CASCADE,
      "id_producto" varchar REFERENCES ${s}."pri_productos"("id")
    )`,
    `CREATE TABLE ${s}."pri_inventario_lotes" (
      "id" varchar PRIMARY KEY, "id_producto" varchar NOT NULL REFERENCES ${s}."pri_productos"("id"),
      "cantidad_inicial" integer NOT NULL, "cantidad_disponible" integer NOT NULL,
      "costo_unitario" numeric(12,2) NOT NULL, "fecha_entrada" timestamptz NOT NULL,
      "activo" boolean NOT NULL DEFAULT true, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "id_compra_detalle" integer REFERENCES ${s}."pri_compras_detalle"("id")
    )`,
    `CREATE INDEX "idx_lotes_producto_fifo" ON ${s}."pri_inventario_lotes" ("id_producto", "fecha_entrada")`,
    `CREATE INDEX "idx_lotes_disponible" ON ${s}."pri_inventario_lotes" ("cantidad_disponible")`,
    `CREATE TABLE ${s}."pri_inventario_movimientos" (
      "id" varchar PRIMARY KEY,
      "tipo_movimiento" ${s}."pri_inventario_movimientos_tipo_movimiento_enum" NOT NULL,
      "motivo_movimiento" ${s}."pri_inventario_movimientos_motivo_movimiento_enum" NOT NULL,
      "cantidad" integer NOT NULL, "stock_anterior" integer NOT NULL, "stock_nuevo" integer NOT NULL,
      "referencia_tabla" varchar, "id_referencia" varchar, "observaciones" text,
      "cancelado" boolean NOT NULL DEFAULT false, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "id_producto" varchar REFERENCES ${s}."pri_productos"("id"),
      "id_lote" varchar REFERENCES ${s}."pri_inventario_lotes"("id"),
      "id_movimiento_reversa" varchar REFERENCES ${s}."pri_inventario_movimientos"("id")
    )`,
    `CREATE TABLE ${s}."pri_ordenes_conceptos_inventario" (
      "id" serial PRIMARY KEY, "cantidad" integer NOT NULL, "costo_unitario" numeric(12,2) NOT NULL,
      "subtotal_costo" numeric(12,2) NOT NULL, "cancelado" boolean NOT NULL DEFAULT false,
      "id_orden_concepto" integer REFERENCES ${s}."pri_ordenes_conceptos"("id") ON DELETE RESTRICT,
      "id_lote" varchar REFERENCES ${s}."pri_inventario_lotes"("id"),
      "id_reversa" integer REFERENCES ${s}."pri_ordenes_conceptos_inventario"("id")
    )`,
    `INSERT INTO ${s}."_schema_migrations" ("version") VALUES (${TENANT_SCHEMA_VERSION})`,
  ];

  for (const statement of statements) {
    await queryRunner.query(statement);
  }
}
