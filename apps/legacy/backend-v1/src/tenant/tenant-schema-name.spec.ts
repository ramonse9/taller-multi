import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';
import {
  normalizeTenantSchemaName,
  quotePostgresIdentifier,
} from './tenant-schema-name';

describe('tenant schema names', () => {
  it('normalizes a valid name from the form', () => {
    expect(normalizeTenantSchemaName('  Taller_Rodriguez_01  ')).toBe(
      'taller_rodriguez_01',
    );
  });

  it.each([
    'public',
    'information_schema',
    'pg_catalog',
    '1_taller',
    'mi-taller',
    'x',
    'taller;drop schema public',
  ])('rejects invalid or reserved name %s', (schema) => {
    expect(() => normalizeTenantSchemaName(schema)).toThrow(
      BadRequestException,
    );
  });

  it('quotes PostgreSQL identifiers defensively', () => {
    expect(quotePostgresIdentifier('tenant"name')).toBe('"tenant""name"');
  });
});
