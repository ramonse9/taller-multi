import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { PlatformRole } from '../platform-users/entities/platform-user.entity';
import { SubscriptionFeature } from './subscription.types';
import { SubscriptionsService } from './subscriptions.service';

export const SUBSCRIPTION_FEATURE_KEY = 'subscriptionFeature';
export const REQUIRES_SUBSCRIPTION_KEY = 'requiresSubscription';
export const ALLOW_INACTIVE_SUBSCRIPTION_KEY = 'allowInactiveSubscription';
export const RequiresFeature = (feature: SubscriptionFeature) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, feature);
export const RequiresSubscription = () => SetMetadata(REQUIRES_SUBSCRIPTION_KEY, true);
export const AllowInactiveSubscription = () =>
  SetMetadata(ALLOW_INACTIVE_SUBSCRIPTION_KEY, true);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<SubscriptionFeature>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRES_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const allowInactive = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowInactive || (!feature && !required)) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Sesión requerida');
    if (user.role === PlatformRole.PlatformAdmin) return true;
    if (!user.companyId) throw new ForbiddenException('Compañía requerida');
    const subscription = await this.subscriptions.getByCompanyId(user.companyId);
    if (feature) this.subscriptions.assertFeature(subscription, feature);
    else this.subscriptions.assertUsable(subscription);
    return true;
  }
}
