import { BadRequestException } from '@nestjs/common';
import {
  buildTenantSchemaName,
  normalizeAndValidateSchemaName,
  quoteIdentifier,
} from './schema-name';

describe('schema name safety', () => {
  it('normalizes a valid manually selected schema', () => {
    expect(normalizeAndValidateSchemaName('  Taller_Norte  ')).toBe('taller_norte');
    expect(quoteIdentifier('taller_norte')).toBe('"taller_norte"');
  });

  it('builds a bounded schema from sequence, type and commercial name', () => {
    expect(buildTenantSchemaName(3, 'mul', 'Melkar’s Diagnóstico Automotriz')).toBe(
      '_0003_mul_melkar_s_diagnostico_automotriz',
    );
    expect(buildTenantSchemaName(12345, 'mec', 'Á'.repeat(100))).toHaveLength(63);
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
