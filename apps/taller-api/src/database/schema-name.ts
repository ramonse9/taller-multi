import { BadRequestException } from '@nestjs/common';

const SCHEMA_PATTERN = /^[a-z][a-z0-9_]{2,49}$/;
const RESERVED = new Set(['public', 'information_schema']);

export function normalizeAndValidateSchemaName(input: string): string {
  const schemaName = input.trim().toLowerCase();
  if (!SCHEMA_PATTERN.test(schemaName)) {
    throw new BadRequestException(
      'El schema debe iniciar con una letra, tener entre 3 y 50 caracteres y usar sólo a-z, 0-9 o _',
    );
  }
  if (RESERVED.has(schemaName) || schemaName.startsWith('pg_')) {
    throw new BadRequestException('El nombre de schema está reservado');
  }
  return schemaName;
}

export function quoteIdentifier(validatedIdentifier: string): string {
  if (!SCHEMA_PATTERN.test(validatedIdentifier)) {
    throw new Error('Unsafe SQL identifier');
  }
  return `"${validatedIdentifier.replaceAll('"', '""')}"`;
}
