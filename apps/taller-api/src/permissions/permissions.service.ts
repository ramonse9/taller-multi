import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { UpdateUserPermissionsDto } from './dto/permission.dto';
import {
  PermissionCatalogItem,
  PermissionCode,
  PermissionTemplate,
  PermissionTemplateCode,
  UserPermissionProfile,
} from './permission.types';

interface PermissionRow {
  code: PermissionCode;
  module: string;
  action: string;
  name: string;
  description: string;
  sort_order: number;
}

interface TemplateRow {
  code: PermissionTemplateCode;
  name: string;
  description: string;
  sort_order: number;
  permission_codes: PermissionCode[];
}

interface TargetRow {
  id: string;
  role: PlatformRole;
  company_id: string;
  template_code: PermissionTemplateCode | null;
  is_customized: boolean | null;
}

const ADMIN_PERMISSION_CODES: PermissionCode[] = [
  'users.view',
  'users.manage',
  'permissions.manage',
];

const USER_FORBIDDEN_PERMISSION_CODES = new Set<PermissionCode>(ADMIN_PERMISSION_CODES);

@Injectable()
export class PermissionsService {
  constructor(private readonly dataSource: DataSource) {}

  has(user: AuthenticatedUser, permission: PermissionCode): boolean {
    return (
      user.role === PlatformRole.PlatformAdmin ||
      user.role === PlatformRole.CompanyAdmin ||
      user.permissions.includes(permission)
    );
  }

  assert(user: AuthenticatedUser, permission: PermissionCode): void {
    if (!this.has(user, permission)) {
      throw new ForbiddenException(`Permiso requerido: ${permission}`);
    }
  }

  async catalog(): Promise<PermissionCatalogItem[]> {
    const rows = await this.dataSource.query<PermissionRow[]>(
      `SELECT code, module, action, name, description, sort_order
       FROM public.permissions ORDER BY sort_order`,
    );
    return rows.map((row) => ({
      code: row.code,
      module: row.module,
      action: row.action,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
    }));
  }

  async templates(): Promise<PermissionTemplate[]> {
    const rows = await this.dataSource.query<TemplateRow[]>(
      `SELECT template.code, template.name, template.description, template.sort_order,
              COALESCE(array_agg(link.permission_code ORDER BY permission.sort_order)
                FILTER (WHERE link.permission_code IS NOT NULL), '{}') AS permission_codes
       FROM public.permission_templates template
       LEFT JOIN public.permission_template_permissions link
         ON link.template_code = template.code
       LEFT JOIN public.permissions permission ON permission.code = link.permission_code
       WHERE template.is_active = TRUE
       GROUP BY template.code, template.name, template.description, template.sort_order
       ORDER BY template.sort_order`,
    );
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      description: row.description,
      sortOrder: row.sort_order,
      permissionCodes: row.permission_codes,
    }));
  }

  async forUser(userId: string, role: PlatformRole): Promise<PermissionCode[]> {
    if (role === PlatformRole.CompanyAdmin) {
      const rows = await this.dataSource.query<Array<{ code: PermissionCode }>>(
        'SELECT code FROM public.permissions ORDER BY sort_order',
      );
      return rows.map(({ code }) => code);
    }
    if (role === PlatformRole.PlatformAdmin) return [];
    const rows = await this.dataSource.query<Array<{ permission_code: PermissionCode }>>(
      `SELECT assignment.permission_code
       FROM public.user_permissions assignment
       JOIN public.permissions permission ON permission.code = assignment.permission_code
       WHERE assignment.user_id = $1 ORDER BY permission.sort_order`,
      [userId],
    );
    return rows.map(({ permission_code }) => permission_code);
  }

  async profile(actor: AuthenticatedUser, userId: string): Promise<UserPermissionProfile> {
    const target = await this.target(actor, userId);
    this.assertCanManageTarget(actor, target);
    return this.hydrateProfile(target);
  }

  async updateProfile(
    actor: AuthenticatedUser,
    userId: string,
    input: UpdateUserPermissionsDto,
  ): Promise<UserPermissionProfile> {
    if (!actor.companyId) throw new ForbiddenException('Se requiere una compañía');
    this.assert(actor, 'permissions.manage');
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const target = await this.lockTarget(runner, actor.companyId, userId);
      this.assertCanManageTarget(actor, target);
      if (target.role === PlatformRole.CompanyAdmin) {
        throw new BadRequestException(
          'El Administrador principal recibe todos los permisos automáticamente',
        );
      }
      this.assertRoleCompatible(target.role, input.permissionCodes);
      if (actor.role === PlatformRole.Admin) {
        const actorPermissions = new Set(await this.forUserWithRunner(runner, actor.id));
        if (input.permissionCodes.some((code) => !actorPermissions.has(code))) {
          throw new ForbiddenException('No puedes conceder permisos que no posees');
        }
      }
      const templatePermissions = input.templateCode
        ? await this.templatePermissions(runner, input.templateCode)
        : [];
      const requested = [...input.permissionCodes].sort();
      const customized =
        input.templateCode === undefined ||
        requested.join('|') !== [...templatePermissions].sort().join('|');

      await runner.query('DELETE FROM public.user_permissions WHERE user_id = $1', [userId]);
      if (requested.length > 0) {
        await runner.query(
          `INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
           SELECT $1, code, $3 FROM unnest($2::varchar[]) AS code`,
          [userId, requested, actor.id],
        );
      }
      await runner.query(
        `INSERT INTO public.user_permission_profiles(
           user_id, template_code, is_customized, updated_by_user_id
         ) VALUES ($1, $2, $3, $4)
         ON CONFLICT(user_id) DO UPDATE SET
           template_code = EXCLUDED.template_code,
           is_customized = EXCLUDED.is_customized,
           updated_by_user_id = EXCLUDED.updated_by_user_id,
           updated_at = now()`,
        [userId, input.templateCode ?? null, customized, actor.id],
      );
      await runner.commitTransaction();
    } catch (error: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    return this.profile(actor, userId);
  }

  async assignInitialPermissions(
    runner: QueryRunner,
    userId: string,
    role: PlatformRole,
    actorId: string,
  ): Promise<void> {
    if (role === PlatformRole.CompanyAdmin || role === PlatformRole.PlatformAdmin) return;
    await runner.query(
      `INSERT INTO public.user_permission_profiles(
         user_id, template_code, is_customized, updated_by_user_id
       ) VALUES ($1, 'administration', $2, $3)
       ON CONFLICT(user_id) DO NOTHING`,
      [userId, role === PlatformRole.Admin, actorId],
    );
    await runner.query(
      `INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
       SELECT $1, permission_code, $2
       FROM public.permission_template_permissions WHERE template_code = 'administration'
       ON CONFLICT DO NOTHING`,
      [userId, actorId],
    );
    if (role === PlatformRole.Admin) {
      await runner.query(
        `INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
         SELECT $1, code, $2 FROM public.permissions WHERE code = ANY($3::varchar[])
         ON CONFLICT DO NOTHING`,
        [userId, actorId, ADMIN_PERMISSION_CODES],
      );
    }
  }

  async syncRolePermissions(
    runner: QueryRunner,
    userId: string,
    previousRole: PlatformRole,
    nextRole: PlatformRole,
    actorId: string,
  ): Promise<void> {
    if (previousRole === nextRole || nextRole === PlatformRole.CompanyAdmin) return;
    await this.assignInitialPermissions(runner, userId, nextRole, actorId);
    if (nextRole === PlatformRole.Admin) {
      await runner.query(
        `INSERT INTO public.user_permissions(user_id, permission_code, granted_by_user_id)
         SELECT $1, code, $2 FROM public.permissions WHERE code = ANY($3::varchar[])
         ON CONFLICT DO NOTHING`,
        [userId, actorId, ADMIN_PERMISSION_CODES],
      );
      return;
    }
    await runner.query(
      'DELETE FROM public.user_permissions WHERE user_id = $1 AND permission_code = ANY($2::varchar[])',
      [userId, ADMIN_PERMISSION_CODES],
    );
  }

  private async target(actor: AuthenticatedUser, userId: string): Promise<TargetRow> {
    if (!actor.companyId) throw new ForbiddenException('Se requiere una compañía');
    const rows = await this.dataSource.query<TargetRow[]>(this.targetSelect(), [
      userId,
      actor.companyId,
    ]);
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  private async lockTarget(
    runner: QueryRunner,
    companyId: string,
    userId: string,
  ): Promise<TargetRow> {
    const rows = (await runner.query(`${this.targetSelect()} FOR UPDATE OF user_account`, [
      userId,
      companyId,
    ])) as TargetRow[];
    if (!rows[0]) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  private targetSelect(): string {
    return `SELECT user_account.id, user_account.role, user_account.company_id,
                   profile.template_code, profile.is_customized
            FROM public.users user_account
            LEFT JOIN public.user_permission_profiles profile ON profile.user_id = user_account.id
            WHERE user_account.id = $1 AND user_account.company_id = $2`;
  }

  private assertCanManageTarget(actor: AuthenticatedUser, target: TargetRow): void {
    if (actor.role === PlatformRole.CompanyAdmin) return;
    if (actor.role !== PlatformRole.Admin || target.role !== PlatformRole.User) {
      throw new ForbiddenException('No puedes administrar los permisos de este usuario');
    }
  }

  private assertRoleCompatible(role: PlatformRole, codes: PermissionCode[]): void {
    if (
      role === PlatformRole.User &&
      codes.some((code) => USER_FORBIDDEN_PERMISSION_CODES.has(code))
    ) {
      throw new BadRequestException('El rol Usuario no puede administrar usuarios ni permisos');
    }
  }

  private async hydrateProfile(target: TargetRow): Promise<UserPermissionProfile> {
    return {
      userId: target.id,
      role: target.role,
      templateCode: target.template_code,
      isCustomized: target.is_customized ?? false,
      automatic: target.role === PlatformRole.CompanyAdmin,
      permissionCodes: await this.forUser(target.id, target.role),
    };
  }

  private async forUserWithRunner(runner: QueryRunner, userId: string): Promise<PermissionCode[]> {
    const rows = (await runner.query(
      'SELECT permission_code FROM public.user_permissions WHERE user_id = $1',
      [userId],
    )) as Array<{ permission_code: PermissionCode }>;
    return rows.map(({ permission_code }) => permission_code);
  }

  private async templatePermissions(
    runner: QueryRunner,
    templateCode: PermissionTemplateCode,
  ): Promise<PermissionCode[]> {
    const templates = (await runner.query(
      'SELECT code FROM public.permission_templates WHERE code = $1 AND is_active = TRUE',
      [templateCode],
    )) as Array<{ code: string }>;
    if (!templates[0]) throw new BadRequestException('Plantilla de permisos inválida');
    const rows = (await runner.query(
      'SELECT permission_code FROM public.permission_template_permissions WHERE template_code = $1',
      [templateCode],
    )) as Array<{ permission_code: PermissionCode }>;
    return rows.map(({ permission_code }) => permission_code);
  }
}
