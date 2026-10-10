import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { createHmac, randomBytes } from 'node:crypto';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { PlatformRole, PlatformUser } from '../platform-users/entities/platform-user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { tokenDurationMilliseconds } from './token-duration';

export interface AuthRequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginResult {
  refreshToken: string;
  response: LoginResponseDto;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenRow {
  token_id: string;
  session_id: string;
  generation: number;
  expires_at: Date;
  consumed_at: Date | null;
  token_revoked_at: Date | null;
  user_id: string;
  last_used_at: Date;
  session_revoked_at: Date | null;
  user_is_active: boolean;
  user_role: PlatformRole;
  company_id: string | null;
  company_is_active: boolean | null;
  subscription_status: string | null;
}

@Injectable()
export class AuthService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_MINUTES = 15;
  private static readonly DUMMY_PASSWORD_HASH =
    '$argon2id$v=19$m=65536,t=3,p=4$tX2A2IXFU7/xHXIGDL5EsQ$fI1U4ps+5za/GDAhYc3IRwCVi2obDcQrB7FZVtNM7kM';
  private readonly refreshTtlMs: number;
  private readonly refreshSecret: string;

  constructor(
    @InjectRepository(PlatformUser) private readonly users: Repository<PlatformUser>,
    @InjectRepository(Company) private readonly companies: Repository<Company>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly subscriptions: SubscriptionsService,
    private readonly permissions: PermissionsService,
  ) {
    this.refreshTtlMs = tokenDurationMilliseconds(
      config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async login(input: LoginDto, metadata: AuthRequestMetadata): Promise<LoginResult> {
    const user = await this.findUser(input.identifier);
    const invalid =
      !user || !user.isActive || (user.lockedUntil !== null && user.lockedUntil > new Date());
    const passwordValid = await argon2.verify(
      user?.passwordHash ?? AuthService.DUMMY_PASSWORD_HASH,
      input.password,
    );
    if (invalid || !passwordValid) {
      if (user && !passwordValid) await this.recordFailedAttempt(user);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const company =
      user.role !== PlatformRole.PlatformAdmin && user.companyId
        ? await this.companies.findOneBy({ id: user.companyId })
        : null;
    if (user.role !== PlatformRole.PlatformAdmin && !company?.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const subscription = company ? await this.subscriptions.getByCompanyId(company.id) : null;
    if (subscription && !subscription.usable) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    const permissions = await this.permissions.forUser(user.id, user.role);
    const tokens = await this.createSession(user.id, metadata);
    return {
      refreshToken: tokens.refreshToken,
      response: {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          loginName:
            user.role === PlatformRole.PlatformAdmin
              ? user.email!
              : `${user.username}@${company!.loginCode}`,
          phone: user.phone,
          phoneVerifiedAt: user.phoneVerifiedAt,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId,
          companyName: company?.name ?? null,
          mustChangePassword: user.mustChangePassword,
          subscription,
          permissions,
        },
      },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const nextToken = this.generateRefreshToken();
    const nextTokenHash = this.hashRefreshToken(nextToken);
    const now = new Date();
    const idleCutoff = new Date(now.getTime() - this.refreshTtlMs);
    const nextExpiration = new Date(now.getTime() + this.refreshTtlMs);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      const rows = (await runner.query(
        `SELECT refresh.id AS token_id, refresh.session_id, refresh.generation,
                refresh.expires_at, refresh.consumed_at,
                refresh.revoked_at AS token_revoked_at,
                session.user_id, session.last_used_at,
                session.revoked_at AS session_revoked_at,
                user_account.is_active AS user_is_active,
                user_account.role AS user_role,
                user_account.company_id,
                company.is_active AS company_is_active,
                subscription.status AS subscription_status
         FROM public.auth_refresh_tokens refresh
         JOIN public.auth_sessions session ON session.id = refresh.session_id
         JOIN public.users user_account ON user_account.id = session.user_id
         LEFT JOIN public.companies company ON company.id = user_account.company_id
         LEFT JOIN public.company_subscriptions subscription
           ON subscription.company_id = user_account.company_id
         WHERE refresh.token_hash = $1
         FOR UPDATE OF refresh, session`,
        [tokenHash],
      )) as RefreshTokenRow[];
      const stored = rows[0];
      if (!stored) throw new UnauthorizedException('Sesión inválida');

      if (stored.consumed_at) {
        await this.revokeSession(runner, stored.session_id);
        await runner.commitTransaction();
        throw new UnauthorizedException('La sesión fue revocada por reutilización del token');
      }

      const membershipIsValid =
        stored.user_role === PlatformRole.PlatformAdmin
          ? stored.company_id === null
          : stored.company_id !== null &&
            stored.company_is_active === true &&
            stored.subscription_status === 'active';
      const sessionIsValid =
        !stored.token_revoked_at &&
        !stored.session_revoked_at &&
        stored.expires_at > now &&
        stored.last_used_at >= idleCutoff &&
        stored.user_is_active &&
        membershipIsValid;
      if (!sessionIsValid) {
        await this.revokeSession(runner, stored.session_id);
        await runner.commitTransaction();
        throw new UnauthorizedException('Sesión expirada');
      }

      const inserted = (await runner.query(
        `INSERT INTO public.auth_refresh_tokens(
           session_id, token_hash, generation, expires_at
         ) VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [stored.session_id, nextTokenHash, stored.generation + 1, nextExpiration],
      )) as Array<{ id: string }>;
      const replacementId = inserted[0]?.id;
      if (!replacementId) throw new Error('No se pudo rotar el refresh token');

      await runner.query(
        `UPDATE public.auth_refresh_tokens
         SET consumed_at = $1, replaced_by_token_id = $2
         WHERE id = $3`,
        [now, replacementId, stored.token_id],
      );
      await runner.query('UPDATE public.auth_sessions SET last_used_at = $1 WHERE id = $2', [
        now,
        stored.session_id,
      ]);
      const accessToken = await this.signAccessToken(stored.user_id, stored.session_id);
      await runner.commitTransaction();
      return { accessToken, refreshToken: nextToken };
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const rows = (await runner.query(
        `SELECT session_id
         FROM public.auth_refresh_tokens
         WHERE token_hash = $1
         FOR UPDATE`,
        [this.hashRefreshToken(refreshToken)],
      )) as Array<{ session_id: string }>;
      if (rows[0]) await this.revokeSession(runner, rows[0].session_id);
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async createSession(
    userId: string,
    metadata: AuthRequestMetadata,
  ): Promise<RefreshResult> {
    const refreshToken = this.generateRefreshToken();
    const expiration = new Date(Date.now() + this.refreshTtlMs);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const sessions = (await runner.query(
        `INSERT INTO public.auth_sessions(user_id, user_agent, ip_address)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [userId, metadata.userAgent?.slice(0, 500) ?? null, metadata.ipAddress],
      )) as Array<{ id: string }>;
      const sessionId = sessions[0]?.id;
      if (!sessionId) throw new Error('No se pudo iniciar la sesión');
      await runner.query(
        `INSERT INTO public.auth_refresh_tokens(
           session_id, token_hash, generation, expires_at
         ) VALUES ($1, $2, 1, $3)`,
        [sessionId, this.hashRefreshToken(refreshToken), expiration],
      );
      const accessToken = await this.signAccessToken(userId, sessionId);
      await runner.commitTransaction();
      return { accessToken, refreshToken };
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, jti: sessionId, typ: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
        expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as never,
      },
    );
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.refreshSecret).update(token).digest('hex');
  }

  private async revokeSession(runner: QueryRunner, sessionId: string): Promise<void> {
    await runner.query(
      `UPDATE public.auth_sessions
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE id = $1`,
      [sessionId],
    );
    await runner.query(
      `UPDATE public.auth_refresh_tokens
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE session_id = $1`,
      [sessionId],
    );
  }

  private async findUser(identifier: string): Promise<PlatformUser | null> {
    const platformUser = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.role = :role AND user.email = :identifier', {
        role: PlatformRole.PlatformAdmin,
        identifier,
      })
      .getOne();
    if (platformUser) return platformUser;

    const separator = identifier.lastIndexOf('@');
    if (separator <= 0 || separator === identifier.length - 1) return null;
    const tenantUser = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .innerJoin(Company, 'company', 'company.id = user.companyId')
      .where('user.username = :username AND company.loginCode = :loginCode', {
        username: identifier.slice(0, separator),
        loginCode: identifier.slice(separator + 1),
      })
      .getOne();
    if (tenantUser) return tenantUser;

    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.role <> :role AND user.email = :identifier', {
        role: PlatformRole.PlatformAdmin,
        identifier,
      })
      .getOne();
  }

  private async recordFailedAttempt(user: PlatformUser): Promise<void> {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil =
      attempts >= AuthService.MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + AuthService.LOCK_MINUTES * 60_000)
        : null;
    await this.users.update(user.id, { failedLoginAttempts: attempts, lockedUntil });
  }
}
