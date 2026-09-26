import { describe, expect, it, jest } from '@jest/globals';
import { QueryRunner } from 'typeorm';
import {
  provisionTenantSchema,
  TENANT_SCHEMA_VERSION,
} from './tenant-schema.provisioner';

describe('tenant schema provisioner', () => {
  it('fully qualifies tenant objects and excludes billing tables', async () => {
    const query = jest.fn<() => Promise<unknown>>().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await provisionTenantSchema(queryRunner, 'taller_rodriguez');

    const sql = query.mock.calls.flat().join('\n');
    expect(sql).toContain('CREATE SCHEMA "taller_rodriguez"');
    expect(sql).toContain('"taller_rodriguez"."pri_clientes"');
    expect(sql).toContain('REFERENCES public."pub_users"');
    expect(sql).toContain(`VALUES (${TENANT_SCHEMA_VERSION})`);
    expect(sql).not.toContain('"pri_facturas"');
    expect(sql).not.toContain('"pri_emisores"');
  });
});
