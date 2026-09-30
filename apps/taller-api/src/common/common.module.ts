import { Global, Module } from '@nestjs/common';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Global()
@Module({
  providers: [SubscriptionsService, SubscriptionGuard],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class CommonModule {}
