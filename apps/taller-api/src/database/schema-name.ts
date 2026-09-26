import { BadRequestException } from '@nestjs/common';

const SCHEMA_PATTERN = /^[a-z_][a-z0-9_]{2,62}$/;
const RESERVED = new Set(['public', 'information_schema']);
export const COMPANY_TYPE_CODES = ['mul', 'car', 'mec'] as const;
export type CompanyTypeCode = (typeof COMPANY_TYPE_CODES)[number];

export function normalizeAndValidateSchemaName(input: string): string {
  const schemaName = input.trim().toLowerCase();
  if (!SCHEMA_PATTERN.test(schemaName)) {
    throw new BadRequestException(
      'El schema debe iniciar con una letra o _, tener entre 3 y 63 caracteres y usar sólo a-z, 0-9 o _',
    );
  }
  if (RESERVED.has(schemaName) || schemaName.startsWith('pg_')) {
    throw new BadRequestException('El nombre de schema está reservado');
  }
  return schemaName;
}

export function buildTenantSchemaName(
  sequenceNumber: string | number,
  companyType: CompanyTypeCode,
  commercialName: string,
): string {
  const number = String(sequenceNumber).padStart(4, '0');
  const prefix = `_${number}_${companyType}_`;
  const slug = commercialName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!slug) throw new Error('El nombre comercial no genera un identificador válido');
  return normalizeAndValidateSchemaName(`${prefix}${slug.slice(0, 63 - prefix.length)}`);
}

export function quoteIdentifier(validatedIdentifier: string): string {
  if (!SCHEMA_PATTERN.test(validatedIdentifier)) {
    throw new Error('Unsafe SQL identifier');
  }
  return `"${validatedIdentifier.replaceAll('"', '""')}"`;
}
