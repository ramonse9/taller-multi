import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { normalizeTenantSchemaName } from './tenant-schema-name';
import { provisionTenantSchema } from './tenant-schema.provisioner';

@Injectable()
export class TenantService {
  constructor(private readonly dataSource: DataSource) {}

  normalizeSchemaName(schema: string): string {
    return normalizeTenantSchemaName(schema);
  }

  async schemaExists(
    schema: string,
    queryRunner?: QueryRunner,
  ): Promise<boolean> {
    const executor = queryRunner ?? this.dataSource;
    const result = await executor.query(
      'SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = $1',
      [schema],
    );

    return result.length > 0;
  }

  async provisionSchema(
    schema: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await provisionTenantSchema(queryRunner, this.normalizeSchemaName(schema));
  }
}
