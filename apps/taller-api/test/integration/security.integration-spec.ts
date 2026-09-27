import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AddressInfo } from 'node:net';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PUBLIC_ENTITIES } from '../../src/database/database-options';
import { PublicBaseline1700000000000 } from '../../src/database/migrations/public/1700000000000-public-baseline';
import { GeneratedSchemasAndTemporaryPasswords1700000001000 } from '../../src/database/migrations/public/1700000001000-generated-schemas-and-temporary-passwords';
import { TenantLoginIdentities1700000002000 } from '../../src/database/migrations/public/1700000002000-tenant-identities-and-sessions';
import { AuthSessions1700000003000 } from '../../src/database/migrations/public/1700000003000-auth-sessions';
import { MobilePasswordRecovery1700000004000 } from '../../src/database/migrations/public/1700000004000-mobile-password-recovery';
import { quoteIdentifier } from '../../src/database/schema-name';
import { seedPublicCatalogs } from '../../src/database/seeds/public-catalogs.seed';

const PLATFORM_EMAIL = 'platform.integration@test.local';
const PLATFORM_PASSWORD = 'PlatformIntegration-2026!';
const TENANT_PASSWORD = 'Temp26a';
const USER_PASSWORD = 'User26a';
const PERMANENT_PASSWORD = 'Clave27b';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    loginName: string;
    role: string;
    companyId: string | null;
    mustChangePassword: boolean;
  };
}

interface ProvisionedTenant extends LoginResponse {
  company: CompanyResponse;
}

interface CompanyResponse {
  id: string;
  name: string;
  schemaName: string;
  loginCode: string;
  admin: { id: string; email: string | null; loginName: string };
}

interface UserResponse {
  id: string;
  email: string | null;
  username: string;
  loginName: string;
  phone: string | null;
  companyId: string;
  isActive: boolean;
}

interface ClientResponse {
  id: string;
  fullName: string;
  createdByUserId: string;
  updatedByUserId: string;
}

interface PaginatedClients {
  totalItems: number;
  items: ClientResponse[];
}

interface HttpResult<T> {
  status: number;
  body: T;
  sessionToken: string | null;
}

interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

interface RecoveryRequestResponse {
  accepted: boolean;
  developmentCode?: string;
}

interface RecoveryVerifyResponse {
  resetToken: string;
  expiresInSeconds: number;
}

describe('Integracion y seguridad multi-tenant con PostgreSQL real', () => {
  let app: INestApplication;
  let control: DataSource;
  let baseUrl: string;
  let platformToken: string;

  const testDatabaseUrl = process.env.TEST_DATABASE_URL!;

  beforeAll(async () => {
    control = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      applicationName: 'taller-integration-control',
    });
    await control.initialize();
    await resetPublicSchema(control);

    const migrations = new DataSource({
      type: 'postgres',
      url: testDatabaseUrl,
      entities: PUBLIC_ENTITIES,
      migrations: [
        PublicBaseline1700000000000,
        GeneratedSchemasAndTemporaryPasswords1700000001000,
        TenantLoginIdentities1700000002000,
        AuthSessions1700000003000,
        MobilePasswordRecovery1700000004000,
      ],
      migrationsTableName: 'public_schema_migrations',
      synchronize: false,
    });
    await migrations.initialize();
    try {
      await migrations.runMigrations();
      const runner = migrations.createQueryRunner();
      await runner.connect();
      try {
        await runner.startTransaction();
        await seedPublicCatalogs(runner);
        const passwordHash = await argon2.hash(PLATFORM_PASSWORD, { type: argon2.argon2id });
        await runner.query(
          `INSERT INTO public.users(email, password_hash, full_name, role, company_id)
           VALUES ($1, $2, $3, 'platform_admin', NULL)`,
          [PLATFORM_EMAIL, passwordHash, 'Administrador de integración'],
        );
        await runner.commitTransaction();
      } catch (error: unknown) {
        if (runner.isTransactionActive) await runner.rollbackTransaction();
        throw error;
      } finally {
        await runner.release();
      }
    } finally {
      await migrations.destroy();
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.listen(0, '127.0.0.1');
    const server = app.getHttpServer() as { address(): AddressInfo | string | null };
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No se pudo resolver el puerto HTTP');
    baseUrl = `http://127.0.0.1:${address.port}/api`;

    platformToken = (await login(PLATFORM_EMAIL, PLATFORM_PASSWORD)).body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (control?.isInitialized) {
      await resetPublicSchema(control);
      await control.destroy();
    }
  });

  it('revierte compañía, schema y versión si falla el aprovisionamiento', async () => {
    const schemasBefore = await tenantSchemaNames();
    const result = await createCompany('Rollback Integration', PLATFORM_EMAIL);

    expect(result.status).toBe(409);
    const companyRows = await control.query<unknown[]>(
      'SELECT 1 FROM public.companies WHERE name = $1',
      ['Rollback Integration'],
    );
    const versionRows = await control.query<unknown[]>(
      `SELECT 1 FROM public.tenant_schema_versions v
       JOIN public.companies c ON c.id = v.company_id
       WHERE c.name = $1`,
      ['Rollback Integration'],
    );
    expect(await tenantSchemaNames()).toEqual(schemasBefore);
    expect(companyRows).toHaveLength(0);
    expect(versionRows).toHaveLength(0);
  });

  it('rechaza un schema físico duplicado sin registrar la compañía', async () => {
    await control.query('CREATE SCHEMA "_9999_mul_duplicate_integration"');
    await control.query("SELECT setval('public.tenant_schema_number_seq', 9999, false)");
    const duplicate = await createCompany('Duplicate Integration', 'duplicate.attempt@test.local');
    expect(duplicate.status).toBe(409);

    const companies = await control.query<unknown[]>(
      'SELECT 1 FROM public.companies WHERE name = $1',
      ['Duplicate Integration'],
    );
    const attemptedUsers = await control.query<unknown[]>(
      'SELECT 1 FROM public.users WHERE email = $1',
      ['duplicate.attempt@test.local'],
    );
    expect(companies).toHaveLength(0);
    expect(attemptedUsers).toHaveLength(0);
  });

  it('aísla los clientes de dos tenants incluso al consultar un id ajeno', async () => {
    const alpha = await provisionAndLogin('Alpha Integration', 'alpha.admin@test.local');
    const beta = await provisionAndLogin('Beta Integration', 'beta.admin@test.local');

    const alphaClient = await request<ClientResponse>('POST', '/clients', {
      token: alpha.accessToken,
      body: { fullName: 'Cliente exclusivo Alpha' },
    });
    const betaClient = await request<ClientResponse>('POST', '/clients', {
      token: beta.accessToken,
      body: { fullName: 'Cliente exclusivo Beta' },
    });
    expect(alphaClient.status).toBe(201);
    expect(betaClient.status).toBe(201);

    const alphaList = await listClients(alpha.accessToken);
    const betaList = await listClients(beta.accessToken);
    expect(alphaList.body.items.map((client) => client.id)).toEqual([alphaClient.body.id]);
    expect(betaList.body.items.map((client) => client.id)).toEqual([betaClient.body.id]);

    const foreignLookup = await request<unknown>('GET', `/clients/${betaClient.body.id}`, {
      token: alpha.accessToken,
    });
    expect(foreignLookup.status).toBe(404);

    const [alphaRows, betaRows] = await Promise.all([
      control.query<Array<{ full_name: string }>>(
        `SELECT full_name FROM ${quoteIdentifier(alpha.company.schemaName)}.customers`,
      ),
      control.query<Array<{ full_name: string }>>(
        `SELECT full_name FROM ${quoteIdentifier(beta.company.schemaName)}.customers`,
      ),
    ]);
    expect(alphaRows).toEqual([{ full_name: 'Cliente exclusivo Alpha' }]);
    expect(betaRows).toEqual([{ full_name: 'Cliente exclusivo Beta' }]);
  });

  it('reutiliza el pool y libera las conexiones tenant después de cada solicitud', async () => {
    const tenant = await provisionAndLogin('Pool Integration', 'pool.admin@test.local');
    await listClients(tenant.accessToken);

    const dataSource = app.get(DataSource);
    const pool = (dataSource.driver as unknown as { master: PoolStats }).master;
    const initialTotal = pool.totalCount;

    for (let index = 0; index < 25; index += 1) {
      const response = await listClients(tenant.accessToken);
      expect(response.status).toBe(200);
    }
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(pool.totalCount).toBe(initialTotal);
    expect(pool.waitingCount).toBe(0);
    expect(pool.idleCount).toBe(pool.totalCount);
  });

  it('renueva el token al usarlo y rechaza sesiones inactivas por más de 14 días', async () => {
    const tenant = await provisionAndLogin('Session Integration', 'session.admin@test.local');
    const active = await listClients(tenant.accessToken);
    expect(active.status).toBe(200);
    expect(active.sessionToken).toBeTruthy();

    await control.query(
      `UPDATE public.auth_sessions SET last_used_at = now() - interval '15 days'
       WHERE id = (
         SELECT id FROM public.auth_sessions WHERE user_id = $1
         ORDER BY created_at DESC LIMIT 1
       )`,
      [tenant.user.id],
    );
    expect((await listClients(tenant.accessToken)).status).toBe(401);
  });

  it('invalida sesiones y logins de usuarios o compañías desactivadas', async () => {
    const tenant = await provisionAndLogin('Disabled Integration', 'disabled.admin@test.local');
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Desactivable',
        username: 'desactivable',
        email: 'disabled.user@test.local',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    const userLogin = await login(`desactivable@${tenant.company.loginCode}`, USER_PASSWORD);
    expect(userLogin.status).toBe(200);

    const disabledUser = await request<UserResponse>('PATCH', `/users/${createdUser.body.id}`, {
      token: tenant.accessToken,
      body: { isActive: false },
    });
    expect(disabledUser.status).toBe(200);
    expect(disabledUser.body).toMatchObject({ isActive: false });
    expect((await login(`desactivable@${tenant.company.loginCode}`, USER_PASSWORD)).status).toBe(
      401,
    );
    expect(
      (await request<unknown>('GET', '/auth/me', { token: userLogin.body.accessToken })).status,
    ).toBe(401);

    await control.query('UPDATE public.companies SET is_active = false WHERE id = $1', [
      tenant.user.companyId,
    ]);
    expect((await login(tenant.user.loginName, PERMANENT_PASSWORD)).status).toBe(401);
    expect((await listClients(tenant.accessToken)).status).toBe(401);
  });

  it('completa compañía → usuario → login → clientes con identidad de auditoría', async () => {
    const tenant = await provisionAndLogin('Full Flow Integration', 'flow.admin@test.local');
    const invalidPassword = await request<unknown>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Inválido',
        username: 'invalido',
        password: 'abcdef',
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(invalidPassword.status).toBe(400);
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Operador Flujo',
        username: 'operador',
        phone: '+526671112233',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    expect(createdUser.body.email).toBeNull();
    expect(createdUser.body.phone).toBe('+526671112233');

    const userLogin = await login(`operador@${tenant.company.loginCode}`, USER_PASSWORD);
    expect(userLogin.status).toBe(200);
    expect(userLogin.body.user.mustChangePassword).toBe(true);
    expect(userLogin.body.user.loginName).toBe(`operador@${tenant.company.loginCode}`);
    expect(userLogin.body.user.companyId).toBe(tenant.user.companyId);
    expect((await listClients(userLogin.body.accessToken)).status).toBe(403);
    const passwordChanged = await request<unknown>('PATCH', '/users/me/password', {
      token: userLogin.body.accessToken,
      body: { currentPassword: USER_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(passwordChanged.status).toBe(204);
    const permanentLogin = await login(`operador@${tenant.company.loginCode}`, PERMANENT_PASSWORD);
    expect(permanentLogin.status).toBe(200);
    expect(permanentLogin.body.user.mustChangePassword).toBe(false);

    const createdClient = await request<ClientResponse>('POST', '/clients', {
      token: permanentLogin.body.accessToken,
      body: {
        fullName: 'Cliente del flujo completo',
        email: 'cliente.flujo@test.local',
        phone: '6671234567',
      },
    });
    expect(createdClient.status).toBe(201);
    expect(createdClient.body.createdByUserId).toBe(createdUser.body.id);
    expect(createdClient.body.updatedByUserId).toBe(createdUser.body.id);

    const listed = await listClients(permanentLogin.body.accessToken);
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(createdClient.body.id);

    const fetched = await request<ClientResponse>('GET', `/clients/${createdClient.body.id}`, {
      token: permanentLogin.body.accessToken,
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body.fullName).toBe('Cliente del flujo completo');

    const updated = await request<ClientResponse>('PATCH', `/clients/${createdClient.body.id}`, {
      token: permanentLogin.body.accessToken,
      body: { notes: 'Actualizado desde la integración' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: createdClient.body.id,
      fullName: 'Cliente del flujo completo',
      updatedByUserId: createdUser.body.id,
    });
  });

  it('recupera la contraseña por OTP móvil y verifica el teléfono', async () => {
    const tenant = await provisionAndLogin('Recovery Integration', 'recovery.admin@test.local');
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Recuperación',
        username: 'movil',
        phone: '+526671112244',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    const identifier = `movil@${tenant.company.loginCode}`;
    const previousSession = await login(identifier, USER_PASSWORD);
    expect(previousSession.status).toBe(200);

    const requested = await request<RecoveryRequestResponse>(
      'POST',
      '/auth/password-recovery/request',
      { body: { identifier, channel: 'sms' } },
    );
    expect(requested.status).toBe(202);
    expect(requested.body.developmentCode).toMatch(/^\d{6}$/);

    const earlyResend = await request<unknown>('POST', '/auth/password-recovery/request', {
      body: { identifier, channel: 'whatsapp' },
    });
    expect(earlyResend.status).toBe(429);

    await control.query(
      `UPDATE public.password_recovery_challenges
       SET last_sent_at = NOW() - interval '61 seconds'
       WHERE user_id = $1`,
      [createdUser.body.id],
    );
    const secondSend = await request<RecoveryRequestResponse>(
      'POST',
      '/auth/password-recovery/request',
      { body: { identifier, channel: 'whatsapp' } },
    );
    expect(secondSend.status).toBe(202);
    await control.query(
      `UPDATE public.password_recovery_challenges
       SET last_sent_at = NOW() - interval '61 seconds'
       WHERE user_id = $1`,
      [createdUser.body.id],
    );
    const thirdSend = await request<RecoveryRequestResponse>(
      'POST',
      '/auth/password-recovery/request',
      { body: { identifier, channel: 'sms' } },
    );
    expect(thirdSend.status).toBe(202);
    await control.query(
      `UPDATE public.password_recovery_challenges
       SET last_sent_at = NOW() - interval '61 seconds'
       WHERE user_id = $1`,
      [createdUser.body.id],
    );
    expect(
      (
        await request<unknown>('POST', '/auth/password-recovery/request', {
          body: { identifier, channel: 'sms' },
        })
      ).status,
    ).toBe(429);

    const invalid = await request<unknown>('POST', '/auth/password-recovery/verify', {
      body: {
        identifier,
        code: thirdSend.body.developmentCode === '000000' ? '000001' : '000000',
      },
    });
    expect(invalid.status).toBe(400);

    const verified = await request<RecoveryVerifyResponse>(
      'POST',
      '/auth/password-recovery/verify',
      { body: { identifier, code: thirdSend.body.developmentCode } },
    );
    expect(verified.status).toBe(200);
    expect(verified.body.resetToken).toBeTruthy();
    expect(verified.body.expiresInSeconds).toBe(600);

    const completed = await request<unknown>('POST', '/auth/password-recovery/complete', {
      body: { resetToken: verified.body.resetToken, password: 'Nueva28c' },
    });
    expect(completed.status).toBe(204);
    expect(
      (
        await request<unknown>('GET', '/auth/me', {
          token: previousSession.body.accessToken,
        })
      ).status,
    ).toBe(401);
    expect((await login(identifier, USER_PASSWORD)).status).toBe(401);
    expect((await login(identifier, 'Nueva28c')).status).toBe(200);

    const rows = await control.query<Array<{ phone_verified_at: Date | null }>>(
      'SELECT phone_verified_at FROM public.users WHERE id = $1',
      [createdUser.body.id],
    );
    expect(rows[0]?.phone_verified_at).toBeTruthy();
  });

  async function createCompany(
    name: string,
    adminEmail: string,
  ): Promise<HttpResult<CompanyResponse>> {
    return request<CompanyResponse>('POST', '/companies', {
      token: platformToken,
      body: {
        name,
        companyTypeCode: 'mul',
        personTypeCode: 'individual',
        withholdsIsr: false,
        withholdsIva: false,
        admin: {
          fullName: `Administrador ${name}`,
          username: adminEmail.split('@')[0]!.replaceAll('.', '_'),
          email: adminEmail,
          phone: '+526671234567',
          password: TENANT_PASSWORD,
          timezoneCode: 'America/Mazatlan',
        },
      },
    });
  }

  async function provisionAndLogin(name: string, email: string): Promise<ProvisionedTenant> {
    const company = await createCompany(name, email);
    expect(company.status).toBe(201);
    const authenticated = await login(company.body.admin.loginName, TENANT_PASSWORD);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.mustChangePassword).toBe(true);
    expect(authenticated.body.user.companyId).toBe(company.body.id);
    const changed = await request<unknown>('PATCH', '/users/me/password', {
      token: authenticated.body.accessToken,
      body: { currentPassword: TENANT_PASSWORD, newPassword: PERMANENT_PASSWORD },
    });
    expect(changed.status).toBe(204);
    const permanent = await login(company.body.admin.loginName, PERMANENT_PASSWORD);
    expect(permanent.status).toBe(200);
    expect(permanent.body.user.mustChangePassword).toBe(false);
    return { ...permanent.body, company: company.body };
  }

  async function tenantSchemaNames(): Promise<string[]> {
    const rows = await control.query<Array<{ nspname: string }>>(
      "SELECT nspname FROM pg_namespace WHERE nspname LIKE '\\_%' ESCAPE '\\' ORDER BY nspname",
    );
    return rows.map(({ nspname }) => nspname);
  }

  function login(identifier: string, password: string): Promise<HttpResult<LoginResponse>> {
    return request<LoginResponse>('POST', '/auth/login', { body: { identifier, password } });
  }

  function listClients(token: string): Promise<HttpResult<PaginatedClients>> {
    return request<PaginatedClients>('GET', '/clients?page=1&limit=20&isActive=true', { token });
  }

  async function request<T>(
    method: string,
    path: string,
    options: { token?: string; body?: unknown } = {},
  ): Promise<HttpResult<T>> {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : undefined) as T,
      sessionToken: response.headers.get('x-session-token'),
    };
  }
});

async function resetPublicSchema(dataSource: DataSource): Promise<void> {
  const tenantSchemas = await dataSource.query<Array<{ nspname: string }>>(
    `SELECT nspname FROM pg_namespace
     WHERE nspname <> 'public'
       AND nspname <> 'information_schema'
       AND left(nspname, 3) <> 'pg_'`,
  );
  for (const { nspname } of tenantSchemas) {
    await dataSource.query(`DROP SCHEMA ${quoteIdentifier(nspname)} CASCADE`);
  }
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public AUTHORIZATION CURRENT_USER');
}
