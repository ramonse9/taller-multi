import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  ChangePasswordDto,
  CreateUserDto,
  PaginatedUsersResponseDto,
  ResetPasswordDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from './dto/user.dto';
import { PlatformRole } from './entities/platform-user.entity';
import { tenantLoginName } from '../database/login-name';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

interface UserRow {
  id: string;
  email: string | null;
  username: string;
  phone: string | null;
  phone_verified_at: Date | null;
  login_code: string;
  full_name: string;
  role: PlatformRole;
  company_id: string;
  timezone_code: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
  updated_at: Date;
}

interface PasswordRow extends UserRow {
  password_hash: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly subscriptions?: SubscriptionsService,
  ) {}

  async list(user: AuthenticatedUser, query: UserQueryDto): Promise<PaginatedUsersResponseDto> {
    const companyId = this.companyIdForManager(user);
    const search = query.search.trim();
    const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
    const filter = `%${escapedSearch}%`;
    const activeFilter = query.isActive === undefined ? null : query.isActive;
    const offset = (query.page - 1) * query.limit;
    const parameters = [companyId, activeFilter, filter];
    const where = `company_id = $1
      AND ($2::boolean IS NULL OR is_active = $2)
      AND ($3 = '%%' OR full_name ILIKE $3 ESCAPE '\\'
        OR COALESCE(email::text, '') ILIKE $3 ESCAPE '\\'
        OR username::text ILIKE $3 ESCAPE '\\'
        OR COALESCE(phone, '') ILIKE $3 ESCAPE '\\')`;

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `SELECT COUNT(*) AS total FROM public.users WHERE ${where}`,
      parameters,
    );
    const totalItems = Number(countRows[0]?.total ?? 0);
    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
              (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code,
              is_active, must_change_password, created_at, updated_at
       FROM public.users
       WHERE ${where}
       ORDER BY full_name, id
       LIMIT $4 OFFSET $5`,
      [...parameters, query.limit, offset],
    );

    return {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.limit),
      hasNextPage: offset + rows.length < totalItems,
      items: rows.map((row) => this.toResponse(row)),
    };
  }

  async getOne(user: AuthenticatedUser, id: string): Promise<UserResponseDto> {
    const companyId = this.companyIdForManager(user);
    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
              (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code,
              is_active, must_change_password, created_at, updated_at
       FROM public.users WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return this.toResponse(rows[0]);
  }

  async create(user: AuthenticatedUser, input: CreateUserDto): Promise<UserResponseDto> {
    const companyId = this.companyIdForManager(user);
    this.assertCanAssignRole(user, input.role);
    await this.subscriptions?.assertCanCreateUser(companyId);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await this.validateTimezone(runner, input.timezoneCode);
      const rows = (await runner.query(
        `INSERT INTO public.users(
           email, username, phone, password_hash, full_name, role, company_id,
           timezone_code, must_change_password
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
                   (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code,
                   is_active, must_change_password, created_at, updated_at`,
        [
          input.email ?? null,
          input.username,
          input.phone,
          passwordHash,
          input.fullName,
          input.role,
          companyId,
          input.timezoneCode,
        ],
      )) as UserRow[];
      const created = rows[0];
      if (!created) throw new Error('No se pudo crear el usuario');
      const response = this.toResponse(created);
      await runner.commitTransaction();
      return response;
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      this.rethrowConflict(error);
      throw error;
    } finally {
      await runner.release();
    }
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const companyId = this.companyIdForManager(user);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const target = await this.lockUser(runner, companyId, id);
      this.assertCanManageTarget(user, target);
      if (
        id === user.id &&
        (input.isActive === false ||
          (input.role !== undefined && input.role !== PlatformRole.CompanyAdmin))
      ) {
        throw new BadRequestException(
          'No puedes desactivar ni remover tu propio rol administrador',
        );
      }
      if (input.role !== undefined) this.assertCanAssignRole(user, input.role);
      if (input.timezoneCode !== undefined) {
        await this.validateTimezone(runner, input.timezoneCode);
      }
      if (!target.is_active && input.isActive === true) {
        await this.subscriptions?.assertCanCreateUser(companyId);
      }
      await this.ensureAdminRemains(runner, companyId, target, input.role, input.isActive);

      const values: unknown[] = [];
      const assignments: string[] = [];
      const add = (column: string, value: unknown): void => {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      };
      if (input.fullName !== undefined) add('full_name', input.fullName);
      if (input.email !== undefined) add('email', input.email);
      if (input.username !== undefined) add('username', input.username);
      if (input.phone !== undefined) {
        add('phone', input.phone);
        assignments.push('phone_verified_at = NULL');
      }
      if (input.role !== undefined) add('role', input.role);
      if (input.timezoneCode !== undefined) add('timezone_code', input.timezoneCode);
      if (input.isActive !== undefined) add('is_active', input.isActive);
      if (assignments.length === 0) throw new BadRequestException('No hay cambios para aplicar');

      values.push(id, companyId);
      const result = (await runner.query(
        `UPDATE public.users
         SET ${assignments.join(', ')}, updated_at = NOW()
         WHERE id = $${values.length - 1} AND company_id = $${values.length}
         RETURNING id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
                   (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code,
                   is_active, must_change_password, created_at, updated_at`,
        values,
      )) as [UserRow[], number];
      const updated = result[0][0];
      if (!updated) throw new NotFoundException('Usuario no encontrado');
      const response = this.toResponse(updated);
      await runner.commitTransaction();
      return response;
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      this.rethrowConflict(error);
      throw error;
    } finally {
      await runner.release();
    }
  }

  async deactivate(user: AuthenticatedUser, id: string): Promise<UserResponseDto> {
    if (id === user.id) throw new BadRequestException('No puedes desactivar tu propio usuario');
    return this.update(user, id, { isActive: false });
  }

  async changeOwnPassword(user: AuthenticatedUser, input: ChangePasswordDto): Promise<void> {
    const companyId = this.companyIdForTenant(user);
    const rows = await this.dataSource.query<PasswordRow[]>(
      `SELECT id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
              (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code, is_active,
              must_change_password, created_at, updated_at, password_hash
       FROM public.users
       WHERE id = $1 AND company_id = $2 AND is_active = TRUE`,
      [user.id, companyId],
    );
    const current = rows[0];
    if (!current || !(await argon2.verify(current.password_hash, input.currentPassword))) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }
    if (await argon2.verify(current.password_hash, input.newPassword)) {
      throw new BadRequestException('La nueva contraseña debe ser diferente');
    }
    const passwordHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.dataSource.query(
      `UPDATE public.users
       SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL,
           must_change_password = false, updated_at = NOW()
       WHERE id = $2 AND company_id = $3`,
      [passwordHash, user.id, companyId],
    );
  }

  async resetPassword(user: AuthenticatedUser, id: string, input: ResetPasswordDto): Promise<void> {
    const companyId = this.companyIdForManager(user);
    if (id === user.id) {
      throw new BadRequestException('Usa el cambio de contraseña personal para tu cuenta');
    }
    const target = await this.getOne(user, id);
    this.assertCanManageTarget(user, target);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    await this.dataSource.query(
      `UPDATE public.users
       SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL,
           must_change_password = true, updated_at = NOW()
       WHERE id = $2 AND company_id = $3`,
      [passwordHash, id, companyId],
    );
  }

  private companyIdForManager(user: AuthenticatedUser): string {
    if (
      (user.role !== PlatformRole.CompanyAdmin && user.role !== PlatformRole.Admin) ||
      !user.companyId
    ) {
      throw new ForbiddenException('Se requiere un administrador de la compañía');
    }
    return user.companyId;
  }

  private assertCanAssignRole(user: AuthenticatedUser, role: PlatformRole): void {
    if (user.role === PlatformRole.Admin && role !== PlatformRole.User) {
      throw new ForbiddenException('Un administrador solo puede asignar el rol Usuario');
    }
  }

  private assertCanManageTarget(actor: AuthenticatedUser, target: Pick<UserRow, 'role'>): void {
    if (actor.role === PlatformRole.Admin && target.role !== PlatformRole.User) {
      throw new ForbiddenException(
        'Un administrador solo puede gestionar usuarios con rol Usuario',
      );
    }
  }

  private companyIdForTenant(user: AuthenticatedUser): string {
    if (user.role === PlatformRole.PlatformAdmin || !user.companyId) {
      throw new ForbiddenException('Se requiere un usuario de compañía');
    }
    return user.companyId;
  }

  private async lockUser(runner: QueryRunner, companyId: string, id: string): Promise<UserRow> {
    const rows = (await runner.query(
      `SELECT id, email, username, phone, phone_verified_at, full_name, role, company_id, timezone_code,
              (SELECT login_code FROM public.companies WHERE id = company_id) AS login_code,
              is_active, must_change_password, created_at, updated_at
       FROM public.users
       WHERE id = $1 AND company_id = $2
       FOR UPDATE`,
      [id, companyId],
    )) as UserRow[];
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  private async ensureAdminRemains(
    runner: QueryRunner,
    companyId: string,
    current: UserRow,
    nextRole?: PlatformRole,
    nextActive?: boolean,
  ): Promise<void> {
    const removesActiveAdmin =
      current.role === PlatformRole.CompanyAdmin &&
      current.is_active &&
      ((nextRole !== undefined && nextRole !== PlatformRole.CompanyAdmin) || nextActive === false);
    if (!removesActiveAdmin) return;

    const rows = (await runner.query(
      `SELECT id FROM public.users
       WHERE company_id = $1 AND role = 'company_admin' AND is_active = TRUE
       FOR UPDATE`,
      [companyId],
    )) as Array<{ id: string }>;
    if (rows.length <= 1) {
      throw new ConflictException('La compañía debe conservar al menos un administrador activo');
    }
  }

  private async validateTimezone(runner: QueryRunner, timezoneCode: string): Promise<void> {
    const rows = (await runner.query(
      'SELECT 1 FROM public.timezones WHERE code = $1 AND is_active = TRUE',
      [timezoneCode],
    )) as unknown[];
    if (rows.length === 0) throw new BadRequestException('Zona horaria inválida');
  }

  private rethrowConflict(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException('El usuario o correo ya está registrado');
    }
  }

  private toResponse(row: UserRow): UserResponseDto {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      loginName: tenantLoginName(row.username, row.login_code),
      phone: row.phone,
      phoneVerifiedAt: row.phone_verified_at,
      fullName: row.full_name,
      role: row.role,
      companyId: row.company_id,
      timezoneCode: row.timezone_code,
      isActive: row.is_active,
      mustChangePassword: row.must_change_password,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
