import { PlatformRole } from '../../platform-users/entities/platform-user.entity';
import { SubscriptionSummary } from '../../subscriptions/subscription.types';
import { PermissionCode } from '../../permissions/permission.types';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string | null;
  loginName: string;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  fullName: string;
  role: PlatformRole;
  companyId: string | null;
  companyName: string | null;
  companySchema: string | null;
  companyLoginCode: string | null;
  mustChangePassword: boolean;
  sessionId: string;
  subscription: SubscriptionSummary | null;
  permissions: PermissionCode[];
}
