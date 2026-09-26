import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  TenantMigrator,
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
} from '../database/tenant/tenant-migrator';
import { normalizeAndValidateSchemaName, quoteIdentifier } from '../database/schema-name';
import { CreateCompanyDto, CompanyResponseDto } from './dto/create-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantMigrator: TenantMigrator,
  ) {}

  async create(input: CreateCompanyDto): Promise<CompanyResponseDto> {
    const schemaName = normalizeAndValidateSchemaName(input.schemaName);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `tenant-schema:${schemaName}`,
      ]);
      await this.validateCatalogs(runner, input.companyTypeCode, input.personTypeCode);
      const registered = (await runner.query(
        'SELECT 1 FROM public.companies WHERE schema_name = $1',
        [schemaName],
      )) as unknown[];
      const physical = (await runner.query('SELECT 1 FROM pg_namespace WHERE nspname = $1', [
        schemaName,
      ])) as unknown[];
      if (registered.length || physical.length) throw new ConflictException('El schema ya existe');

      const company = runner.manager.create(Company, {
        name: input.name.trim(),
        schemaName,
        companyTypeCode: input.companyTypeCode,
        personTypeCode: input.personTypeCode,
        withholdsIsr: input.withholdsIsr,
        withholdsIva: input.withholdsIva,
      });
      const saved = await runner.manager.save(company);
      await runner.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);
      await this.tenantMigrator.migrateBase(runner, schemaName);
      await runner.query(
        'INSERT INTO public.tenant_schema_versions(company_id, version, migration_name) VALUES ($1, $2, $3)',
        [saved.id, TENANT_BASE_VERSION, TENANT_BASE_NAME],
      );
      await runner.commitTransaction();
      return this.toResponse(saved);
    } catch (error: unknown) {
      await runner.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof UnprocessableEntityException)
        throw error;
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('La compañía o el schema ya están registrados');
      }
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async validateCatalogs(
    runner: import('typeorm').QueryRunner,
    companyType: string,
    personType: string,
  ): Promise<void> {
    const result = (await runner.query(
      `SELECT
        EXISTS(SELECT 1 FROM public.company_types WHERE code = $1 AND is_active) AS company_type_exists,
        EXISTS(SELECT 1 FROM public.person_types WHERE code = $2 AND is_active) AS person_type_exists`,
      [companyType, personType],
    )) as Array<{ company_type_exists: boolean; person_type_exists: boolean }>;
    if (!result[0]?.company_type_exists || !result[0]?.person_type_exists) {
      throw new UnprocessableEntityException('Tipo de compañía o persona inválido');
    }
  }

  private toResponse(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      schemaName: company.schemaName,
      companyTypeCode: company.companyTypeCode,
      personTypeCode: company.personTypeCode,
      isActive: company.isActive,
      withholdsIsr: company.withholdsIsr,
      withholdsIva: company.withholdsIva,
      createdAt: company.createdAt,
    };
  }
}
