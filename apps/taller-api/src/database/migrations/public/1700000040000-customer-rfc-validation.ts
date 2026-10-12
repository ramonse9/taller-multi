import { MigrationInterface, QueryRunner } from 'typeorm';
import { quoteIdentifier } from '../../schema-name';

interface CompanySchemaRow {
  id: string;
  schema_name: string;
}

interface InvalidRfcRow {
  id: string;
  customer_type: string;
  tax_id: string;
  problem: string;
}

/**
 * Estructura basada en la documentación técnica oficial del SAT:
 * https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461175750595&ssbinary=true
 *
 * Los RFC genéricos están definidos en la regla 2.7.1.23:
 * https://wwwmat.sat.gob.mx/articulo/16302/regla-2.7.1.26
 */
export class CustomerRfcValidation1700000040000 implements MigrationInterface {
  name = 'CustomerRfcValidation1700000040000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at, id',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      const invalidRows = (await queryRunner.query(`
        SELECT id::text, customer_type, tax_id,
               CASE
                 WHEN tax_id !~ '^[A-ZÑ&]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$'
                   THEN 'estructura inválida'
                 WHEN customer_type = 'person' AND
                      tax_id ~ '^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$'
                   THEN 'RFC de persona moral usado en persona física'
                 WHEN customer_type = 'company' AND
                      tax_id ~ '^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$'
                   THEN 'RFC de persona física usado en persona moral'
                 ELSE 'RFC incompatible'
               END AS problem
        FROM ${schema}.customers
        WHERE tax_id IS NOT NULL
          AND tax_id NOT IN ('XAXX010101000', 'XEXX010101000')
          AND NOT (
            (customer_type = 'person' AND
             tax_id ~ '^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$') OR
            (customer_type = 'company' AND
             tax_id ~ '^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$')
          )
        ORDER BY id
        LIMIT 20
      `)) as InvalidRfcRow[];

      if (invalidRows.length > 0) {
        const details = invalidRows
          .map((row) => `${row.id}: ${row.tax_id} (${row.customer_type}; ${row.problem})`)
          .join('; ');
        throw new Error(
          `No se puede migrar el schema ${company.schema_name}: existen RFC de clientes inválidos. Corrige los datos antes de reintentar. ${details}`,
        );
      }

      await queryRunner.query(`
        ALTER TABLE ${schema}.customers
          ADD CONSTRAINT customers_tax_id_customer_type_check
          CHECK (
            tax_id IS NULL OR
            tax_id IN ('XAXX010101000', 'XEXX010101000') OR
            (customer_type = 'person' AND
             tax_id ~ '^[A-ZÑ&]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$') OR
            (customer_type = 'company' AND
             tax_id ~ '^[A-ZÑ&]{3}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]$')
          )
      `);
      await queryRunner.query(
        `INSERT INTO public.tenant_schema_versions(company_id, version, migration_name)
         VALUES ($1, 26, $2) ON CONFLICT (company_id, version) DO NOTHING`,
        [company.id, this.name],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const companies = (await queryRunner.query(
      'SELECT id, schema_name FROM public.companies ORDER BY created_at DESC, id DESC',
    )) as CompanySchemaRow[];

    for (const company of companies) {
      const schema = quoteIdentifier(company.schema_name);
      await queryRunner.query(`
        ALTER TABLE ${schema}.customers
          DROP CONSTRAINT IF EXISTS customers_tax_id_customer_type_check
      `);
      await queryRunner.query(
        'DELETE FROM public.tenant_schema_versions WHERE company_id = $1 AND version = 26',
        [company.id],
      );
    }
  }
}
