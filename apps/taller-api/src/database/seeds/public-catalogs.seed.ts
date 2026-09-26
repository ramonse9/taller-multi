import { QueryRunner } from 'typeorm';

export const PUBLIC_CATALOGS = {
  companyTypes: [
    { code: 'workshop', name: 'Taller automotriz' },
    { code: 'multi_service', name: 'Multiservicios' },
  ],
  personTypes: [
    { code: 'individual', name: 'Persona física' },
    { code: 'legal_entity', name: 'Persona moral' },
  ],
  timezones: [
    {
      code: 'America/Mazatlan',
      description: 'Hora estándar de la montaña',
    },
    {
      code: 'America/Mexico_City',
      description: 'Hora del centro de México',
    },
    { code: 'America/Tijuana', description: 'Hora del Pacífico' },
  ],
} as const;

export async function seedPublicCatalogs(queryRunner: QueryRunner): Promise<void> {
  for (const companyType of PUBLIC_CATALOGS.companyTypes) {
    await queryRunner.query(
      `INSERT INTO public.company_types(code, name, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, is_active = TRUE`,
      [companyType.code, companyType.name],
    );
  }

  for (const personType of PUBLIC_CATALOGS.personTypes) {
    await queryRunner.query(
      `INSERT INTO public.person_types(code, name, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, is_active = TRUE`,
      [personType.code, personType.name],
    );
  }

  for (const timezone of PUBLIC_CATALOGS.timezones) {
    await queryRunner.query(
      `INSERT INTO public.timezones(code, description, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (code) DO UPDATE
       SET description = EXCLUDED.description, is_active = TRUE`,
      [timezone.code, timezone.description],
    );
  }
}
