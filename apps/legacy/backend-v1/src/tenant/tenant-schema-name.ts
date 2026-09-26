import { BadRequestException } from '@nestjs/common';

export const TENANT_SCHEMA_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;

const RESERVED_SCHEMA_NAMES = new Set(['public', 'information_schema']);

export function normalizeTenantSchemaName(value: string): string {
  const schema = value?.trim().toLowerCase();

  if (
    !schema ||
    !TENANT_SCHEMA_PATTERN.test(schema) ||
    RESERVED_SCHEMA_NAMES.has(schema) ||
    schema.startsWith('pg_')
  ) {
    throw new BadRequestException(
      'El schema debe tener entre 3 y 50 caracteres, iniciar con una letra y contener únicamente letras minúsculas, números o guion bajo. No se permiten nombres reservados.',
    );
  }

  return schema;
}

export function quotePostgresIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}
