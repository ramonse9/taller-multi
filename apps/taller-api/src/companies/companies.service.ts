import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  TenantMigrator,
  TENANT_BASE_NAME,
  TENANT_BASE_VERSION,
} from '../database/tenant/tenant-migrator';
import { buildTenantSchemaName, quoteIdentifier } from '../database/schema-name';
import { tenantLoginName } from '../database/login-name';
import { UserResponseDto } from '../platform-users/dto/user.dto';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { ResetPasswordDto } from '../platform-users/dto/user.dto';
import { PasswordResetService } from '../platform-users/password-reset.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateCompanyDto, CompanyResponseDto } from './dto/create-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantMigrator: TenantMigrator,
    private readonly passwordResets: PasswordResetService,
  ) {}

  async list(): Promise<CompanyResponseDto[]> {
    const rows = await this.dataSource.query<
      Array<{
        id: string;
        name: string;
        schema_name: string;
        login_code: string;
        company_type_code: string;
        person_type_code: string;
        is_active: boolean;
        withholds_isr: boolean;
        withholds_iva: boolean;
        created_at: Date;
        admin_id: string;
        admin_email: string | null;
        admin_username: string;
        admin_phone: string | null;
        admin_phone_verified_at: Date | null;
        admin_full_name: string;
        admin_role: PlatformRole;
        admin_timezone_code: string;
        admin_is_active: boolean;
        admin_must_change_password: boolean;
        admin_created_at: Date;
        admin_updated_at: Date;
      }>
    >(
      `SELECT company.id, company.name, company.schema_name, company.login_code,
              company.company_type_code, company.person_type_code, company.is_active,
              company.withholds_isr, company.withholds_iva, company.created_at,
              admin.id AS admin_id, admin.email AS admin_email,
              admin.username AS admin_username, admin.phone AS admin_phone,
              admin.phone_verified_at AS admin_phone_verified_at,
              admin.full_name AS admin_full_name, admin.role AS admin_role,
              admin.timezone_code AS admin_timezone_code,
              admin.is_active AS admin_is_active,
              admin.must_change_password AS admin_must_change_password,
              admin.created_at AS admin_created_at, admin.updated_at AS admin_updated_at
       FROM public.companies company
       JOIN LATERAL (
         SELECT tenant_admin.*
         FROM public.users tenant_admin
         WHERE tenant_admin.company_id = company.id
           AND tenant_admin.role = $1
         ORDER BY tenant_admin.created_at ASC, tenant_admin.id ASC
         LIMIT 1
       ) admin ON TRUE
       ORDER BY company.created_at DESC, company.id DESC`,
      [PlatformRole.CompanyAdmin],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      schemaName: row.schema_name,
      loginCode: row.login_code,
      companyTypeCode: row.company_type_code,
      personTypeCode: row.person_type_code,
      isActive: row.is_active,
      withholdsIsr: row.withholds_isr,
      withholdsIva: row.withholds_iva,
      createdAt: row.created_at,
      admin: {
        id: row.admin_id,
        email: row.admin_email,
        username: row.admin_username,
        loginName: tenantLoginName(row.admin_username, row.login_code),
        phone: row.admin_phone,
        phoneVerifiedAt: row.admin_phone_verified_at,
        fullName: row.admin_full_name,
        role: row.admin_role,
        companyId: row.id,
        timezoneCode: row.admin_timezone_code,
        isActive: row.admin_is_active,
        mustChangePassword: row.admin_must_change_password,
        createdAt: row.admin_created_at,
        updatedAt: row.admin_updated_at,
      },
    }));
  }

  async resetPrimaryAdminPassword(
    user: AuthenticatedUser,
    companyId: string,
    input: ResetPasswordDto,
  ): Promise<void> {
    await this.passwordResets.resetPrimaryCompanyAdmin(user, companyId, input.password);
  }

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
        input.planCode ?? 'basic',
      );
      const sequenceRows = (await runner.query(
        "SELECT nextval('public.tenant_schema_number_seq')::text AS number",
      )) as Array<{ number: string }>;
      const sequenceNumber = sequenceRows[0]?.number;
      if (!sequenceNumber) throw new Error('No se pudo generar el consecutivo del schema');
      const schemaName = buildTenantSchemaName(sequenceNumber, input.companyTypeCode, input.name);
      const loginCode = input.loginCode;
      await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `company-login-code:${loginCode}`,
      ]);
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
      const trialDays = input.trialDays ?? 14;
      const planCode = input.planCode ?? 'basic';
      const status = trialDays > 0 ? 'trialing' : 'active';
      await runner.query(
        `INSERT INTO public.company_subscriptions(
           company_id, plan_code, status, trial_starts_at, trial_ends_at,
           current_period_starts_at
         ) VALUES (
           $1, $2, $3,
           CASE WHEN $4::integer > 0 THEN now() ELSE NULL END,
           CASE WHEN $4::integer > 0 THEN now() + make_interval(days => $4) ELSE NULL END,
           CASE WHEN $4::integer = 0 THEN now() ELSE NULL END
         )`,
        [saved.id, planCode, status, trialDays],
      );
      await runner.query(
        `INSERT INTO public.company_subscription_history(
           company_id, new_plan_code, new_status, reason
         ) VALUES ($1, $2, $3, 'Asignación durante el onboarding')`,
        [saved.id, planCode, status],
      );
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
          input.admin.phone,
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
        phoneVerifiedAt: null,
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
    planCode: string,
  ): Promise<void> {
    const result = (await runner.query(
      `SELECT
        EXISTS(SELECT 1 FROM public.company_types WHERE code = $1 AND is_active) AS company_type_exists,
        EXISTS(SELECT 1 FROM public.person_types WHERE code = $2 AND is_active) AS person_type_exists,
        EXISTS(SELECT 1 FROM public.timezones WHERE code = $3 AND is_active) AS timezone_exists,
        EXISTS(SELECT 1 FROM public.subscription_plans WHERE code = $4 AND is_active) AS plan_exists`,
      [companyType, personType, timezoneCode, planCode],
    )) as Array<{
      company_type_exists: boolean;
      person_type_exists: boolean;
      timezone_exists: boolean;
      plan_exists: boolean;
    }>;
    if (
      !result[0]?.company_type_exists ||
      !result[0]?.person_type_exists ||
      !result[0]?.timezone_exists ||
      !result[0]?.plan_exists
    ) {
      throw new UnprocessableEntityException('Tipo de compañía, persona o zona horaria inválido');
    }
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
