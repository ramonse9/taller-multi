import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from './entities/platform-user.entity';

interface PasswordResetTargetRow {
  id: string;
  company_id: string;
  role: PlatformRole;
  is_active: boolean;
}

type PasswordResetSource = 'tenant_admin' | 'platform_admin';

@Injectable()
export class PasswordResetService {
  constructor(private readonly dataSource: DataSource) {}

  async resetForTenant(
    actor: AuthenticatedUser,
    targetUserId: string,
    password: string,
  ): Promise<void> {
    if (
      !actor.companyId ||
      (actor.role !== PlatformRole.CompanyAdmin && actor.role !== PlatformRole.Admin)
    ) {
      throw new ForbiddenException('Se requiere un administrador de la compañía');
    }
    if (actor.id === targetUserId) {
      throw new BadRequestException('Usa el cambio de contraseña personal para tu cuenta');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const target = await this.lockTenantTarget(runner, actor.companyId, targetUserId);
      this.assertTenantHierarchy(actor.role, target.role);
      this.assertActive(target);
      await this.applyReset(runner, actor, target, passwordHash, 'tenant_admin');
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async resetPrimaryCompanyAdmin(
    actor: AuthenticatedUser,
    companyId: string,
    password: string,
  ): Promise<void> {
    if (actor.role !== PlatformRole.PlatformAdmin || actor.companyId !== null) {
      throw new ForbiddenException('Se requiere administrador de plataforma');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const companies = (await runner.query(
        'SELECT id FROM public.companies WHERE id = $1 FOR SHARE',
        [companyId],
      )) as Array<{ id: string }>;
      if (!companies[0]) throw new NotFoundException('Compañía no encontrada');

      const targets = (await runner.query(
        `SELECT id, company_id, role, is_active
         FROM public.users
         WHERE company_id = $1 AND role = $2 AND is_active = TRUE
         ORDER BY created_at ASC, id ASC
         LIMIT 1
         FOR UPDATE`,
        [companyId, PlatformRole.CompanyAdmin],
      )) as PasswordResetTargetRow[];
      const target = targets[0];
      if (!target) {
        throw new NotFoundException('La compañía no tiene un Administrador principal activo');
      }

      await this.applyReset(runner, actor, target, passwordHash, 'platform_admin');
      await runner.commitTransaction();
    } catch (error) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  private async lockTenantTarget(
    runner: QueryRunner,
    companyId: string,
    targetUserId: string,
  ): Promise<PasswordResetTargetRow> {
    const rows = (await runner.query(
      `SELECT id, company_id, role, is_active
       FROM public.users
       WHERE id = $1 AND company_id = $2
       FOR UPDATE`,
      [targetUserId, companyId],
    )) as PasswordResetTargetRow[];
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  private assertTenantHierarchy(actorRole: PlatformRole, targetRole: PlatformRole): void {
    const allowedTargets =
      actorRole === PlatformRole.CompanyAdmin
        ? [PlatformRole.Admin, PlatformRole.User]
        : [PlatformRole.User];
    if (!allowedTargets.includes(targetRole)) {
      throw new ForbiddenException('No puedes restablecer la contraseña de este usuario');
    }
  }

  private assertActive(target: PasswordResetTargetRow): void {
    if (!target.is_active) {
      throw new BadRequestException(
        'No puedes restablecer la contraseña de un usuario desactivado',
      );
    }
  }

  private async applyReset(
    runner: QueryRunner,
    actor: AuthenticatedUser,
    target: PasswordResetTargetRow,
    passwordHash: string,
    source: PasswordResetSource,
  ): Promise<void> {
    await runner.query(
      `UPDATE public.users
       SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL,
           must_change_password = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, target.id],
    );
    await runner.query(
      `UPDATE public.auth_sessions
       SET revoked_at = NOW()
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [target.id],
    );
    await runner.query(
      `INSERT INTO public.password_reset_events(
         company_id, target_user_id, reset_by_user_id, reset_by_role, target_role, source
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [target.company_id, target.id, actor.id, actor.role, target.role, source],
    );
  }
}
