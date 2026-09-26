import { MigrationInterface, QueryRunner } from 'typeorm';

/** Global/shared catalog and identity structure. Tenant business tables are
 * deliberately absent; they are provisioned by tenant-schema.provisioner. */
export class PublicBaseline1800000000000 implements MigrationInterface {
  name = 'PublicBaseline1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      'CREATE EXTENSION IF NOT EXISTS unaccent',
      'REVOKE CREATE ON SCHEMA public FROM PUBLIC',
      `CREATE TABLE public."pub_companias_tipos_giros" ("tipo" varchar PRIMARY KEY, "createdAt" timestamptz NOT NULL DEFAULT now())`,
      `CREATE TABLE public."pub_sat_tipos_personas" ("tipo" varchar PRIMARY KEY, "retenciones" boolean NOT NULL)`,
      `CREATE TABLE public."pub_sat_retenciones_iva" ("id" varchar PRIMARY KEY, "porcentaje" numeric(6,4) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now())`,
      `CREATE TABLE public."pub_sat_retenciones_isr" ("id" varchar PRIMARY KEY, "porcentaje" numeric(6,4) NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now())`,
      `CREATE TABLE public."pub_sat_tipos_productos_servicios" ("tipo" varchar PRIMARY KEY)`,
      `CREATE TABLE public."pub_sat_claves_unidades" ("clave" varchar PRIMARY KEY, "nombre" varchar NOT NULL, "descripcion" varchar NOT NULL, "nota" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_objetos_impuestos" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_regimenes_fiscales" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "fisica" boolean NOT NULL, "moral" boolean NOT NULL)`,
      `CREATE TABLE public."pub_sat_uso_cfdi" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "fisica" boolean NOT NULL, "moral" boolean NOT NULL)`,
      `CREATE TABLE public."pub_sat_metodos_pagos" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_impuestos" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "retencion" boolean NOT NULL, "traslado" boolean NOT NULL)`,
      `CREATE TABLE public."pub_sat_cancelaciones_motivos" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_exportaciones" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_monedas" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_formas_pagos" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "bancarizado" boolean NOT NULL)`,
      `CREATE TABLE public."pub_sat_tipos_comprobantes" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_tipos_relaciones" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_sat_pais" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_zonas_horarias" ("clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL)`,
      `CREATE TABLE public."pub_companias" (
        "id" varchar PRIMARY KEY, "nombre" text NOT NULL UNIQUE, "schema" text NOT NULL UNIQUE,
        "is_active" boolean NOT NULL DEFAULT true, "modulo_inventario" boolean NOT NULL DEFAULT false,
        "modulo_facturacion" boolean NOT NULL DEFAULT false, "modulo_gastos" boolean NOT NULL DEFAULT false,
        "modulo_nomina" boolean NOT NULL DEFAULT false, "createdAt" timestamptz NOT NULL DEFAULT now(),
        "tipo_compania_tipo_giro" varchar REFERENCES public."pub_companias_tipos_giros"("tipo"),
        "tipo_sat_tipo_persona" varchar REFERENCES public."pub_sat_tipos_personas"("tipo"),
        "id_sat_retencion_isr" varchar REFERENCES public."pub_sat_retenciones_isr"("id"),
        "id_sat_retencion_iva" varchar REFERENCES public."pub_sat_retenciones_iva"("id")
      )`,
      `CREATE TABLE public."pub_compania_info" (
        "id" serial PRIMARY KEY, "telefono" text NOT NULL, "calle" text NOT NULL,
        "numeroLocal" text NOT NULL, "colonia" text NOT NULL, "ciudad" text NOT NULL,
        "codigoPostal" text NOT NULL, "correoElectronico" text NOT NULL,
        "id_compania" varchar UNIQUE REFERENCES public."pub_companias"("id") ON DELETE CASCADE
      )`,
      `CREATE TYPE public."pub_users_role_enum" AS ENUM ('capturista', 'admin', 'super')`,
      `CREATE TABLE public."pub_users" (
        "id" varchar PRIMARY KEY, "email" text NOT NULL UNIQUE, "password" text NOT NULL,
        "full_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true,
        "role" public."pub_users_role_enum" NOT NULL DEFAULT 'capturista',
        "failedLoginAttempts" integer NOT NULL DEFAULT 0, "lockedUntil" timestamp,
        "refreshTokenHash" varchar, "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "id_compania" varchar REFERENCES public."pub_companias"("id"),
        "clave_zona_horaria" varchar REFERENCES public."pub_zonas_horarias"("clave")
      )`,
      `CREATE TABLE public."pub_marcas" (
        "id" varchar PRIMARY KEY, "nombre" varchar(30) NOT NULL,
        "createdAtUser" varchar REFERENCES public."pub_users"("id"),
        "updatedAtUser" varchar REFERENCES public."pub_users"("id")
      )`,
      `CREATE TABLE public."pub_modelos" (
        "id" varchar PRIMARY KEY, "nombre" varchar(30) NOT NULL,
        "createdAtUser" varchar REFERENCES public."pub_users"("id"),
        "updatedAtUser" varchar REFERENCES public."pub_users"("id"),
        "id_marca" varchar REFERENCES public."pub_marcas"("id")
      )`,
      `CREATE TABLE public."pub_sat_productos_servicios" (
        "id" varchar PRIMARY KEY, "clave" varchar NOT NULL UNIQUE, "descripcion" varchar NOT NULL,
        "palabras_similares" text NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
        "tipo_compania_tipo_giro" varchar NOT NULL REFERENCES public."pub_companias_tipos_giros"("tipo"),
        "tipo_sat_tipo_producto_servicio" varchar NOT NULL REFERENCES public."pub_sat_tipos_productos_servicios"("tipo"),
        "clave_sat_clave_unidad" varchar NOT NULL REFERENCES public."pub_sat_claves_unidades"("clave"),
        "clave_sat_objeto_impuesto" varchar NOT NULL REFERENCES public."pub_sat_objetos_impuestos"("clave")
      )`,
      `CREATE TABLE public."pub_sat_uso_cfdi_regimen_fiscal" (
        "clave_sat_uso_cfdi" varchar NOT NULL REFERENCES public."pub_sat_uso_cfdi"("clave"),
        "clave_sat_regimen_fiscal" varchar NOT NULL REFERENCES public."pub_sat_regimenes_fiscales"("clave"),
        PRIMARY KEY ("clave_sat_uso_cfdi", "clave_sat_regimen_fiscal")
      )`,
      `CREATE TABLE public."pub_sat_impuestos_porcentajes" (
        "clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL, "tasa" numeric(10,6) NOT NULL,
        "tipo" varchar NOT NULL, "operacion" varchar NOT NULL,
        "clave_sat_impuesto" varchar REFERENCES public."pub_sat_impuestos"("clave")
      )`,
      `CREATE TABLE public."pub_sat_estado" (
        "clave" varchar PRIMARY KEY, "descripcion" varchar NOT NULL,
        "clave_pais" varchar NOT NULL REFERENCES public."pub_sat_pais"("clave")
      )`,
    ];

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'pub_sat_estado', 'pub_sat_impuestos_porcentajes', 'pub_sat_uso_cfdi_regimen_fiscal',
      'pub_sat_productos_servicios', 'pub_modelos', 'pub_marcas', 'pub_users',
      'pub_compania_info', 'pub_companias', 'pub_zonas_horarias', 'pub_sat_pais',
      'pub_sat_tipos_relaciones', 'pub_sat_tipos_comprobantes', 'pub_sat_formas_pagos',
      'pub_sat_monedas', 'pub_sat_exportaciones', 'pub_sat_cancelaciones_motivos',
      'pub_sat_impuestos', 'pub_sat_metodos_pagos', 'pub_sat_uso_cfdi',
      'pub_sat_regimenes_fiscales', 'pub_sat_objetos_impuestos', 'pub_sat_claves_unidades',
      'pub_sat_tipos_productos_servicios', 'pub_sat_retenciones_isr',
      'pub_sat_retenciones_iva', 'pub_sat_tipos_personas', 'pub_companias_tipos_giros',
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE public."${table}"`);
    }
    await queryRunner.query('DROP TYPE public."pub_users_role_enum"');
  }
}
