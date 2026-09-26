export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'platform_admin' | 'company_admin' | 'user';
  companyId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}
