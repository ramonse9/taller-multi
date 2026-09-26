import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  TenantMigrator,
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
} from '../database/tenant/tenant-migrator';
import { normalizeAndValidateSchemaName, quoteIdentifier } from '../database/schema-name';
import { UserResponseDto } from '../platform-users/dto/user.dto';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
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
    const passwordHash = await argon2.hash(input.admin.password, {
      type: argon2.argon2id,
    });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `tenant-schema:${schemaName}`,
      ]);
      await this.validateCatalogs(
        runner,
        input.companyTypeCode,
        input.personTypeCode,
        input.admin.timezoneCode,
      );
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
      const admins = (await runner.query(
        `INSERT INTO public.users(
           email, password_hash, full_name, role, company_id, timezone_code
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, company_id, timezone_code,
                   is_active, created_at, updated_at`,
        [
          input.admin.email,
          passwordHash,
          input.admin.fullName,
          PlatformRole.CompanyAdmin,
          saved.id,
          input.admin.timezoneCode,
        ],
      )) as Array<{
        id: string;
        email: string;
        full_name: string;
        role: PlatformRole;
        company_id: string;
        timezone_code: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
      const admin = admins[0];
      if (!admin) throw new Error('No se pudo crear el administrador de la compañía');
      const response = this.toResponse(saved, {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
        companyId: admin.company_id,
        timezoneCode: admin.timezone_code,
        isActive: admin.is_active,
        createdAt: admin.created_at,
        updatedAt: admin.updated_at,
      });
      await runner.commitTransaction();
      return response;
    } catch (error: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      if (error instanceof ConflictException || error instanceof UnprocessableEntityException)
        throw error;
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'La compañía, el schema o el correo del administrador ya están registrados',
        );
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
    timezoneCode: string,
  ): Promise<void> {
    const result = (await runner.query(
      `SELECT
        EXISTS(SELECT 1 FROM public.company_types WHERE code = $1 AND is_active) AS company_type_exists,
        EXISTS(SELECT 1 FROM public.person_types WHERE code = $2 AND is_active) AS person_type_exists,
        EXISTS(SELECT 1 FROM public.timezones WHERE code = $3 AND is_active) AS timezone_exists`,
      [companyType, personType, timezoneCode],
    )) as Array<{
      company_type_exists: boolean;
      person_type_exists: boolean;
      timezone_exists: boolean;
    }>;
    if (
      !result[0]?.company_type_exists ||
      !result[0]?.person_type_exists ||
      !result[0]?.timezone_exists
    ) {
      throw new UnprocessableEntityException('Tipo de compañía, persona o zona horaria inválido');
    }
  }

  private toResponse(company: Company, admin: UserResponseDto): CompanyResponseDto {
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
      admin,
    };
  }
}
