import { PlatformRole } from '../../platform-users/entities/platform-user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string | null;
  loginName: string;
  phone: string | null;
  fullName: string;
  role: PlatformRole;
  companyId: string | null;
  companySchema: string | null;
  companyLoginCode: string | null;
  mustChangePassword: boolean;
  sessionId: string;
}
