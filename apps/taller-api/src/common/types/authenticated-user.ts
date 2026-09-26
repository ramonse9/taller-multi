import { PlatformRole } from '../../platform-users/entities/platform-user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: PlatformRole;
  companyId: string | null;
  companySchema: string | null;
  mustChangePassword: boolean;
}
