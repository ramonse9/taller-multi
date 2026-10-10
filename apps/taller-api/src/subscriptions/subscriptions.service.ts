import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import {
  ChangeSubscriptionDto,
  CompanySubscriptionResponseDto,
  SubscriptionPlanResponseDto,
} from './dto/subscription.dto';
import {
  SUBSCRIPTION_LIMITS,
  SubscriptionFeature,
  SubscriptionLimit,
  SubscriptionPlanCode,
  SubscriptionStatus,
  SubscriptionSummary,
} from './subscription.types';

interface SubscriptionRow {
  company_id: string;
  company_name?: string;
  company_login_code?: string;
  plan_code: SubscriptionPlanCode;
  plan_name: string;
  status: SubscriptionStatus;
}

interface PlanRow {
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  sort_order: number;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly dataSource: DataSource) {}

  async listPlans(): Promise<SubscriptionPlanResponseDto[]> {
    const plans = await this.dataSource.query<PlanRow[]>(
      `SELECT code, name, description, sort_order
       FROM public.subscription_plans WHERE is_active = TRUE ORDER BY sort_order`,
    );
    return Promise.all(plans.map((plan) => this.hydratePlan(plan)));
  }

  async current(user: AuthenticatedUser): Promise<SubscriptionSummary> {
    if (!user.companyId) throw new ForbiddenException('Se requiere una compañía');
    return this.getByCompanyId(user.companyId);
  }

  async getByCompanyId(companyId: string): Promise<SubscriptionSummary> {
    const rows = await this.dataSource.query<SubscriptionRow[]>(
      `${this.subscriptionSelect()} WHERE subscription.company_id = $1`,
      [companyId],
    );
    const row = rows[0];
    if (!row) throw new ForbiddenException('La compañía no tiene una suscripción asignada');
    return this.hydrateSubscription(row);
  }

  async listCompanies(): Promise<CompanySubscriptionResponseDto[]> {
    const rows = await this.dataSource.query<SubscriptionRow[]>(
      `${this.subscriptionSelect(true)} ORDER BY company.name, company.id`,
    );
    return Promise.all(
      rows.map(async (row) => ({
        ...(await this.hydrateSubscription(row)),
        companyName: row.company_name!,
        companyLoginCode: row.company_login_code!,
      })),
    );
  }

  async change(
    actor: AuthenticatedUser,
    companyId: string,
    input: ChangeSubscriptionDto,
  ): Promise<CompanySubscriptionResponseDto> {
    if (actor.role !== PlatformRole.PlatformAdmin) {
      throw new ForbiddenException('Se requiere administrador de plataforma');
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction('SERIALIZABLE');
    try {
      const current = await this.lockSubscription(runner, companyId);
      const plans = (await runner.query(
        'SELECT code FROM public.subscription_plans WHERE code = $1 AND is_active = TRUE',
        [input.planCode],
      )) as Array<{ code: string }>;
      if (!plans[0]) throw new NotFoundException('Plan no encontrado');

      await runner.query(
        `UPDATE public.company_subscriptions
         SET plan_code = $1, status = $2,
             updated_at = now()
         WHERE company_id = $3`,
        [input.planCode, input.status, companyId],
      );
      await runner.query(
        `UPDATE public.companies
         SET is_active = $2::varchar = 'active', updated_at = now()
         WHERE id = $1`,
        [companyId, input.status],
      );
      await runner.query(
        `INSERT INTO public.company_subscription_history(
           company_id, previous_plan_code, new_plan_code, previous_status, new_status,
           reason, changed_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          companyId,
          current.plan_code,
          input.planCode,
          current.status,
          input.status,
          input.reason ?? null,
          actor.id,
        ],
      );
      if (input.status !== 'active') {
        await runner.query(
          `UPDATE public.auth_refresh_tokens refresh
           SET revoked_at = COALESCE(refresh.revoked_at, now())
           WHERE refresh.session_id IN (
             SELECT session.id
             FROM public.auth_sessions session
             JOIN public.users user_account ON user_account.id = session.user_id
             WHERE user_account.company_id = $1
           )`,
          [companyId],
        );
        await runner.query(
          `UPDATE public.auth_sessions session
           SET revoked_at = COALESCE(session.revoked_at, now())
           FROM public.users user_account
           WHERE user_account.id = session.user_id
             AND user_account.company_id = $1`,
          [companyId],
        );
      }
      await runner.commitTransaction();
    } catch (error: unknown) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
    const rows = await this.dataSource.query<SubscriptionRow[]>(
      `${this.subscriptionSelect(true)} WHERE subscription.company_id = $1`,
      [companyId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Compañía no encontrada');
    return {
      ...(await this.hydrateSubscription(row)),
      companyName: row.company_name!,
      companyLoginCode: row.company_login_code!,
    };
  }

  async assertCanCreateUser(companyId: string): Promise<void> {
    const subscription = await this.getByCompanyId(companyId);
    this.assertUsable(subscription);
    const limit = subscription.limits.max_users;
    if (limit === null) return;
    const rows = await this.dataSource.query<Array<{ total: string }>>(
      'SELECT COUNT(*) AS total FROM public.users WHERE company_id = $1 AND is_active = TRUE',
      [companyId],
    );
    if (Number(rows[0]?.total ?? 0) >= limit) {
      throw new ConflictException(
        `El plan ${subscription.planName} permite hasta ${limit} usuarios activos`,
      );
    }
  }

  assertUsable(subscription: SubscriptionSummary): void {
    if (!subscription.usable) {
      throw new ForbiddenException('La suscripción de la compañía no está disponible');
    }
  }

  assertFeature(subscription: SubscriptionSummary, feature: SubscriptionFeature): void {
    this.assertUsable(subscription);
    if (!subscription.features.includes(feature)) {
      throw new ForbiddenException(
        `La capacidad ${feature} no está incluida en el plan ${subscription.planName}`,
      );
    }
  }

  private subscriptionSelect(withCompany = false): string {
    return `SELECT subscription.company_id, subscription.plan_code, plan.name AS plan_name,
             subscription.status
             ${withCompany ? ', company.name AS company_name, company.login_code AS company_login_code' : ''}
      FROM public.company_subscriptions subscription
      JOIN public.subscription_plans plan ON plan.code = subscription.plan_code
      ${withCompany ? 'JOIN public.companies company ON company.id = subscription.company_id' : ''}`;
  }

  private async hydratePlan(plan: PlanRow): Promise<SubscriptionPlanResponseDto> {
    const [features, limits] = await Promise.all([
      this.features(plan.code),
      this.limits(plan.code),
    ]);
    return {
      code: plan.code,
      name: plan.name,
      description: plan.description,
      sortOrder: plan.sort_order,
      features,
      limits,
    };
  }

  private async hydrateSubscription(row: SubscriptionRow): Promise<SubscriptionSummary> {
    const [features, limits] = await Promise.all([
      this.features(row.plan_code),
      this.limits(row.plan_code),
    ]);
    return {
      companyId: row.company_id,
      planCode: row.plan_code,
      planName: row.plan_name,
      status: row.status,
      usable: this.isUsable(row),
      features,
      limits,
    };
  }

  private async features(planCode: SubscriptionPlanCode): Promise<SubscriptionFeature[]> {
    const rows = await this.dataSource.query<Array<{ feature_code: SubscriptionFeature }>>(
      `SELECT feature_code FROM public.subscription_plan_features
       WHERE plan_code = $1 ORDER BY feature_code`,
      [planCode],
    );
    return rows.map((row) => row.feature_code);
  }

  private async limits(
    planCode: SubscriptionPlanCode,
  ): Promise<Record<SubscriptionLimit, number | null>> {
    const rows = await this.dataSource.query<
      Array<{ limit_code: SubscriptionLimit; limit_value: number | null }>
    >(
      `SELECT limit_code, limit_value FROM public.subscription_plan_limits
       WHERE plan_code = $1`,
      [planCode],
    );
    const limits = Object.fromEntries(SUBSCRIPTION_LIMITS.map((code) => [code, null])) as Record<
      SubscriptionLimit,
      number | null
    >;
    for (const row of rows) limits[row.limit_code] = row.limit_value;
    return limits;
  }

  private isUsable(row: SubscriptionRow): boolean {
    return row.status === 'active';
  }

  private async lockSubscription(
    runner: QueryRunner,
    companyId: string,
  ): Promise<{ plan_code: SubscriptionPlanCode; status: SubscriptionStatus }> {
    const companies = (await runner.query(
      'SELECT id FROM public.companies WHERE id = $1 FOR UPDATE',
      [companyId],
    )) as Array<{ id: string }>;
    if (!companies[0]) throw new NotFoundException('Compañía no encontrada');
    const rows = (await runner.query(
      `SELECT plan_code, status FROM public.company_subscriptions
       WHERE company_id = $1 FOR UPDATE`,
      [companyId],
    )) as Array<{ plan_code: SubscriptionPlanCode; status: SubscriptionStatus }>;
    if (!rows[0]) throw new NotFoundException('Suscripción no encontrada');
    return rows[0];
  }
}
