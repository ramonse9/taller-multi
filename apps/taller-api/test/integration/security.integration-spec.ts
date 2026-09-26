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
import { quoteIdentifier } from '../../src/database/schema-name';
import { seedPublicCatalogs } from '../../src/database/seeds/public-catalogs.seed';

const PLATFORM_EMAIL = 'platform.integration@test.local';
const PLATFORM_PASSWORD = 'PlatformIntegration-2026!';
const TENANT_PASSWORD = 'TenantIntegration-2026!';
const USER_PASSWORD = 'UserIntegration-2026!';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    companyId: string | null;
  };
}

interface CompanyResponse {
  id: string;
  name: string;
  schemaName: string;
  admin: { id: string; email: string };
}

interface UserResponse {
  id: string;
  email: string;
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
}

interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
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
      migrations: [PublicBaseline1700000000000],
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
    const result = await createCompany('Rollback Integration', 'it_rollback', PLATFORM_EMAIL);

    expect(result.status).toBe(409);
    const [schemaRows, companyRows, versionRows] = await Promise.all([
      control.query<unknown[]>('SELECT 1 FROM pg_namespace WHERE nspname = $1', ['it_rollback']),
      control.query<unknown[]>('SELECT 1 FROM public.companies WHERE schema_name = $1', [
        'it_rollback',
      ]),
      control.query<unknown[]>(
        `SELECT 1 FROM public.tenant_schema_versions v
         JOIN public.companies c ON c.id = v.company_id
         WHERE c.schema_name = $1`,
        ['it_rollback'],
      ),
    ]);
    expect(schemaRows).toHaveLength(0);
    expect(companyRows).toHaveLength(0);
    expect(versionRows).toHaveLength(0);
  });

  it('rechaza un schema duplicado sin alterar el primer tenant', async () => {
    const first = await createCompany(
      'Duplicate Original Integration',
      'it_duplicate',
      'duplicate.original@test.local',
    );
    expect(first.status).toBe(201);

    const duplicate = await createCompany(
      'Duplicate Attempt Integration',
      'it_duplicate',
      'duplicate.attempt@test.local',
    );
    expect(duplicate.status).toBe(409);

    const companies = await control.query<Array<{ name: string }>>(
      'SELECT name FROM public.companies WHERE schema_name = $1',
      ['it_duplicate'],
    );
    const attemptedUsers = await control.query<unknown[]>(
      'SELECT 1 FROM public.users WHERE email = $1',
      ['duplicate.attempt@test.local'],
    );
    expect(companies).toEqual([{ name: 'Duplicate Original Integration' }]);
    expect(attemptedUsers).toHaveLength(0);
  });

  it('aísla los clientes de dos tenants incluso al consultar un id ajeno', async () => {
    const alpha = await provisionAndLogin(
      'Alpha Integration',
      'it_alpha',
      'alpha.admin@test.local',
    );
    const beta = await provisionAndLogin('Beta Integration', 'it_beta', 'beta.admin@test.local');

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
      control.query<Array<{ full_name: string }>>('SELECT full_name FROM it_alpha.customers'),
      control.query<Array<{ full_name: string }>>('SELECT full_name FROM it_beta.customers'),
    ]);
    expect(alphaRows).toEqual([{ full_name: 'Cliente exclusivo Alpha' }]);
    expect(betaRows).toEqual([{ full_name: 'Cliente exclusivo Beta' }]);
  });

  it('reutiliza el pool y libera las conexiones tenant después de cada solicitud', async () => {
    const tenant = await provisionAndLogin('Pool Integration', 'it_pool', 'pool.admin@test.local');
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

  it('invalida sesiones y logins de usuarios o compañías desactivadas', async () => {
    const tenant = await provisionAndLogin(
      'Disabled Integration',
      'it_disabled',
      'disabled.admin@test.local',
    );
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Usuario Desactivable',
        email: 'disabled.user@test.local',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);
    const userLogin = await login('disabled.user@test.local', USER_PASSWORD);
    expect(userLogin.status).toBe(200);

    const disabledUser = await request<UserResponse>('PATCH', `/users/${createdUser.body.id}`, {
      token: tenant.accessToken,
      body: { isActive: false },
    });
    expect(disabledUser.status).toBe(200);
    expect(disabledUser.body).toMatchObject({ isActive: false });
    expect((await login('disabled.user@test.local', USER_PASSWORD)).status).toBe(401);
    expect(
      (await request<unknown>('GET', '/auth/me', { token: userLogin.body.accessToken })).status,
    ).toBe(401);

    await control.query('UPDATE public.companies SET is_active = false WHERE id = $1', [
      tenant.user.companyId,
    ]);
    expect((await login('disabled.admin@test.local', TENANT_PASSWORD)).status).toBe(401);
    expect((await listClients(tenant.accessToken)).status).toBe(401);
  });

  it('completa compañía → usuario → login → clientes con identidad de auditoría', async () => {
    const tenant = await provisionAndLogin(
      'Full Flow Integration',
      'it_full_flow',
      'flow.admin@test.local',
    );
    const createdUser = await request<UserResponse>('POST', '/users', {
      token: tenant.accessToken,
      body: {
        fullName: 'Operador Flujo',
        email: 'flow.user@test.local',
        password: USER_PASSWORD,
        timezoneCode: 'America/Mazatlan',
        role: 'user',
      },
    });
    expect(createdUser.status).toBe(201);

    const userLogin = await login('flow.user@test.local', USER_PASSWORD);
    expect(userLogin.status).toBe(200);
    expect(userLogin.body.user.companyId).toBe(tenant.user.companyId);

    const createdClient = await request<ClientResponse>('POST', '/clients', {
      token: userLogin.body.accessToken,
      body: {
        fullName: 'Cliente del flujo completo',
        email: 'cliente.flujo@test.local',
        phone: '6671234567',
      },
    });
    expect(createdClient.status).toBe(201);
    expect(createdClient.body.createdByUserId).toBe(createdUser.body.id);
    expect(createdClient.body.updatedByUserId).toBe(createdUser.body.id);

    const listed = await listClients(userLogin.body.accessToken);
    expect(listed.status).toBe(200);
    expect(listed.body.totalItems).toBe(1);
    expect(listed.body.items[0]?.id).toBe(createdClient.body.id);

    const fetched = await request<ClientResponse>('GET', `/clients/${createdClient.body.id}`, {
      token: userLogin.body.accessToken,
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body.fullName).toBe('Cliente del flujo completo');

    const updated = await request<ClientResponse>('PATCH', `/clients/${createdClient.body.id}`, {
      token: userLogin.body.accessToken,
      body: { notes: 'Actualizado desde la integración' },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: createdClient.body.id,
      fullName: 'Cliente del flujo completo',
      updatedByUserId: createdUser.body.id,
    });
  });

  async function createCompany(
    name: string,
    schemaName: string,
    adminEmail: string,
  ): Promise<HttpResult<CompanyResponse>> {
    return request<CompanyResponse>('POST', '/companies', {
      token: platformToken,
      body: {
        name,
        schemaName,
        companyTypeCode: 'workshop',
        personTypeCode: 'individual',
        withholdsIsr: false,
        withholdsIva: false,
        admin: {
          fullName: `Administrador ${name}`,
          email: adminEmail,
          password: TENANT_PASSWORD,
          timezoneCode: 'America/Mazatlan',
        },
      },
    });
  }

  async function provisionAndLogin(
    name: string,
    schemaName: string,
    email: string,
  ): Promise<LoginResponse> {
    const company = await createCompany(name, schemaName, email);
    expect(company.status).toBe(201);
    const authenticated = await login(email, TENANT_PASSWORD);
    expect(authenticated.status).toBe(200);
    expect(authenticated.body.user.companyId).toBe(company.body.id);
    return authenticated.body;
  }

  function login(email: string, password: string): Promise<HttpResult<LoginResponse>> {
    return request<LoginResponse>('POST', '/auth/login', { body: { email, password } });
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
