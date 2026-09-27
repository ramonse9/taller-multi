import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  TenantMigrator,
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
} from '../database/tenant/tenant-migrator';
import { buildTenantSchemaName, quoteIdentifier } from '../database/schema-name';
import { companyLoginCodeBase, tenantLoginName } from '../database/login-name';
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
    const passwordHash = await argon2.hash(input.admin.password, {
      type: argon2.argon2id,
    });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      await this.validateCatalogs(
        runner,
        input.companyTypeCode,
        input.personTypeCode,
        input.admin.timezoneCode,
      );
      const sequenceRows = (await runner.query(
        "SELECT nextval('public.tenant_schema_number_seq')::text AS number",
      )) as Array<{ number: string }>;
      const sequenceNumber = sequenceRows[0]?.number;
      if (!sequenceNumber) throw new Error('No se pudo generar el consecutivo del schema');
      const schemaName = buildTenantSchemaName(sequenceNumber, input.companyTypeCode, input.name);
      const loginCode = await this.nextLoginCode(runner, input.name);
      await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `tenant-schema:${schemaName}`,
      ]);
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
        loginCode,
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
           email, username, phone, password_hash, full_name, role, company_id,
           timezone_code, must_change_password
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id, email, username, phone, full_name, role, company_id, timezone_code,
                   is_active, must_change_password, created_at, updated_at`,
        [
          input.admin.email ?? null,
          input.admin.username,
          input.admin.phone ?? null,
          passwordHash,
          input.admin.fullName,
          PlatformRole.CompanyAdmin,
          saved.id,
          input.admin.timezoneCode,
        ],
      )) as Array<{
        id: string;
        email: string | null;
        username: string;
        phone: string | null;
        full_name: string;
        role: PlatformRole;
        company_id: string;
        timezone_code: string;
        is_active: boolean;
        must_change_password: boolean;
        created_at: Date;
        updated_at: Date;
      }>;
      const admin = admins[0];
      if (!admin) throw new Error('No se pudo crear el administrador de la compañía');
      const response = this.toResponse(saved, {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        loginName: tenantLoginName(admin.username, saved.loginCode),
        phone: admin.phone,
        fullName: admin.full_name,
        role: admin.role,
        companyId: admin.company_id,
        timezoneCode: admin.timezone_code,
        isActive: admin.is_active,
        mustChangePassword: admin.must_change_password,
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
          'La compañía, el schema, el código público, el usuario o el correo del administrador ya están registrados',
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

  private async nextLoginCode(
    runner: import('typeorm').QueryRunner,
    commercialName: string,
  ): Promise<string> {
    const base = companyLoginCodeBase(commercialName);
    await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `company-login-code:${base}`,
    ]);
    const rows = (await runner.query(
      `SELECT login_code FROM public.companies
       WHERE login_code = $1 OR login_code LIKE $1 || '%'
       ORDER BY login_code`,
      [base],
    )) as Array<{ login_code: string }>;
    const used = new Set(rows.map(({ login_code }) => login_code));
    if (!used.has(base)) return base;
    for (let suffix = 2; suffix < 1_000_000; suffix += 1) {
      const candidate = `${base.slice(0, 40 - String(suffix).length)}${suffix}`;
      if (!used.has(candidate)) return candidate;
    }
    throw new Error('No se pudo generar un código público de compañía');
  }

  private toResponse(company: Company, admin: UserResponseDto): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      schemaName: company.schemaName,
      loginCode: company.loginCode,
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
