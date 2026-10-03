import { Global, Module } from '@nestjs/common';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PermissionsService } from '../permissions/permissions.service';

@Global()
@Module({
  providers: [SubscriptionsService, SubscriptionGuard, PermissionsService],
  exports: [SubscriptionsService, SubscriptionGuard, PermissionsService],
})
export class CommonModule {}
