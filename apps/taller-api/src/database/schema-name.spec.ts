import { BadRequestException } from '@nestjs/common';
import { normalizeAndValidateSchemaName, quoteIdentifier } from './schema-name';

describe('schema name safety', () => {
  it('normalizes a valid manually selected schema', () => {
    expect(normalizeAndValidateSchemaName('  Taller_Norte  ')).toBe('taller_norte');
    expect(quoteIdentifier('taller_norte')).toBe('"taller_norte"');
  });

  it.each([
    'public',
    'information_schema',
    'pg_catalog',
    '2tenant',
    'ab',
    'tenant-name',
    'tenant;drop schema public',
  ])('rejects %s', (value) => {
    expect(() => normalizeAndValidateSchemaName(value)).toThrow(BadRequestException);
  });
});
