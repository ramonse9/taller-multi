import { Global, Module } from '@nestjs/common';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PermissionGuard } from '../permissions/permission.guard';

@Global()
@Module({
  providers: [SubscriptionsService, SubscriptionGuard, PermissionsService, PermissionGuard],
  exports: [SubscriptionsService, SubscriptionGuard, PermissionsService, PermissionGuard],
})
export class CommonModule {}
