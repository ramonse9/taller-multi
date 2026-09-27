import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import { DataSource, QueryRunner } from 'typeorm';
import {
  CompletePasswordRecoveryDto,
  PasswordRecoveryRequestedDto,
  PasswordRecoveryVerifiedDto,
  RequestPasswordRecoveryDto,
  VerifyPasswordRecoveryDto,
} from './dto/password-recovery.dto';
import { MobileMessagingService } from './mobile-messaging.service';

interface RecoveryUserRow {
  id: string;
  phone: string | null;
}

interface ChallengeRow {
  id: string;
  user_id: string;
  phone: string;
  code_hash: string;
  expires_at: Date;
  failed_attempts: number;
  send_count: number;
  send_window_started_at: Date;
  last_sent_at: Date;
  verified_at: Date | null;
  consumed_at: Date | null;
}

@Injectable()
export class PasswordRecoveryService {
  private static readonly OTP_LIFETIME_MS = 10 * 60_000;
  private static readonly RESET_LIFETIME_MS = 10 * 60_000;
  private static readonly RESEND_WAIT_MS = 60_000;
  private static readonly SEND_WINDOW_MS = 60 * 60_000;
  private static readonly MAX_SENDS = 3;
  private static readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly messaging: MobileMessagingService,
  ) {}

  async request(input: RequestPasswordRecoveryDto): Promise<PasswordRecoveryRequestedDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    let code: string | undefined;
    try {
      const user = await this.findActiveUser(runner, input.identifier);
      if (user?.phone) code = await this.createAndSendChallenge(runner, user, input.channel);
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }

    const localProvider = (this.config.get<string>('MOBILE_PROVIDER') ?? 'console') === 'console';
    return {
      accepted: true,
      message:
        'Si el usuario está activo y tiene teléfono, enviaremos un código al número registrado.',
      ...(code && localProvider ? { developmentCode: code } : {}),
    };
  }

  async verify(input: VerifyPasswordRecoveryDto): Promise<PasswordRecoveryVerifiedDto> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const user = await this.findActiveUser(runner, input.identifier);
      if (!user) throw this.invalidCode();
      const rows = (await runner.query(
        `SELECT id, user_id, phone, code_hash, expires_at, failed_attempts, send_count,
                send_window_started_at, last_sent_at, verified_at, consumed_at
         FROM public.password_recovery_challenges
         WHERE user_id = $1 AND consumed_at IS NULL
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [user.id],
      )) as ChallengeRow[];
      const challenge = rows[0];
      if (
        !challenge ||
        challenge.verified_at ||
        challenge.phone !== user.phone ||
        challenge.expires_at.getTime() <= Date.now() ||
        challenge.failed_attempts >= PasswordRecoveryService.MAX_ATTEMPTS
      ) {
        throw this.invalidCode();
      }

      if (!this.matchesCode(challenge.id, input.code, challenge.code_hash)) {
        await runner.query(
          `UPDATE public.password_recovery_challenges
           SET failed_attempts = LEAST(failed_attempts + 1, $2)
           WHERE id = $1`,
          [challenge.id, PasswordRecoveryService.MAX_ATTEMPTS],
        );
        await runner.commitTransaction();
        throw this.invalidCode();
      }

      const resetToken = randomBytes(32).toString('base64url');
      await runner.query(
        `UPDATE public.password_recovery_challenges
         SET verified_at = NOW(), reset_token_hash = $2,
             reset_token_expires_at = NOW() + interval '10 minutes'
         WHERE id = $1`,
        [challenge.id, this.hashResetToken(resetToken)],
      );
      await runner.query(
        `UPDATE public.users SET phone_verified_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND phone = $2`,
        [user.id, challenge.phone],
      );
      await runner.commitTransaction();
      return {
        resetToken,
        expiresInSeconds: PasswordRecoveryService.RESET_LIFETIME_MS / 1000,
      };
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async complete(input: CompletePasswordRecoveryDto): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const rows = (await runner.query(
        `SELECT challenge.user_id
         FROM public.password_recovery_challenges challenge
         JOIN public.users user_account ON user_account.id = challenge.user_id
         LEFT JOIN public.companies company ON company.id = user_account.company_id
         WHERE challenge.reset_token_hash = $1
           AND challenge.verified_at IS NOT NULL
           AND challenge.consumed_at IS NULL
           AND challenge.reset_token_expires_at > NOW()
           AND challenge.phone = user_account.phone
           AND user_account.is_active = TRUE
           AND (user_account.role = 'platform_admin' OR company.is_active = TRUE)
         FOR UPDATE OF challenge`,
        [this.hashResetToken(input.resetToken)],
      )) as Array<{ user_id: string }>;
      const userId = rows[0]?.user_id;
      if (!userId) throw new BadRequestException('El enlace de recuperación expiró o ya fue usado');
      const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

      await runner.query(
        `UPDATE public.password_recovery_challenges
         SET consumed_at = NOW()
         WHERE reset_token_hash = $1`,
        [this.hashResetToken(input.resetToken)],
      );

      await runner.query(
        `UPDATE public.users
         SET password_hash = $1, must_change_password = false,
             failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
         WHERE id = $2 AND is_active = TRUE`,
        [passwordHash, userId],
      );
      await runner.query(
        'UPDATE public.auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId],
      );
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async createAndSendChallenge(
    runner: QueryRunner,
    user: RecoveryUserRow,
    channel: 'sms' | 'whatsapp',
  ): Promise<string> {
    await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [user.id]);
    const rows = (await runner.query(
      `SELECT id, user_id, phone, code_hash, expires_at, failed_attempts, send_count,
              send_window_started_at, last_sent_at, verified_at, consumed_at
       FROM public.password_recovery_challenges
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [user.id],
    )) as ChallengeRow[];
    const previous = rows[0];
    const now = Date.now();
    if (
      previous &&
      now - previous.last_sent_at.getTime() < PasswordRecoveryService.RESEND_WAIT_MS
    ) {
      throw new HttpException(
        'Espera un minuto antes de solicitar otro código',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const sameWindow =
      previous &&
      now - previous.send_window_started_at.getTime() < PasswordRecoveryService.SEND_WINDOW_MS;
    if (sameWindow && previous.send_count >= PasswordRecoveryService.MAX_SENDS) {
      throw new HttpException(
        'Se alcanzó el límite de envíos. Intenta más tarde',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const sendCount = sameWindow ? previous.send_count + 1 : 1;
    const windowStartedAt = sameWindow ? previous.send_window_started_at : new Date();
    if (previous) {
      await runner.query(
        'UPDATE public.password_recovery_challenges SET consumed_at = NOW() WHERE id = $1',
        [previous.id],
      );
    }
    await runner.query(
      `INSERT INTO public.password_recovery_challenges(
         id, user_id, channel, phone, code_hash, expires_at, send_count, send_window_started_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        challengeId,
        user.id,
        channel,
        user.phone,
        this.hashCode(challengeId, code),
        new Date(now + PasswordRecoveryService.OTP_LIFETIME_MS),
        sendCount,
        windowStartedAt,
      ],
    );
    await this.messaging.sendRecoveryCode(user.phone!, channel, code);
    return code;
  }

  private async findActiveUser(
    runner: QueryRunner,
    identifier: string,
  ): Promise<RecoveryUserRow | null> {
    const separator = identifier.lastIndexOf('@');
    if (separator <= 0) return null;
    const rows = (await runner.query(
      `SELECT u.id, u.phone
       FROM public.users u
       LEFT JOIN public.companies c ON c.id = u.company_id
       WHERE u.is_active = TRUE
         AND (
           (u.role = 'platform_admin' AND u.email = $1)
           OR
           (u.role <> 'platform_admin' AND c.is_active = TRUE AND (
             (u.username = $2 AND c.login_code = $3) OR u.email = $1
           ))
         )
       LIMIT 1`,
      [identifier, identifier.slice(0, separator), identifier.slice(separator + 1)],
    )) as RecoveryUserRow[];
    return rows[0] ?? null;
  }

  private hashCode(challengeId: string, code: string): string {
    const secret =
      this.config.get<string>('OTP_SECRET') ?? this.config.getOrThrow<string>('JWT_SECRET');
    return createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex');
  }

  private matchesCode(challengeId: string, code: string, expected: string): boolean {
    const actualBuffer = Buffer.from(this.hashCode(challengeId, code), 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return (
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private invalidCode(): BadRequestException {
    return new BadRequestException('El código es inválido, expiró o alcanzó el límite de intentos');
  }
}
