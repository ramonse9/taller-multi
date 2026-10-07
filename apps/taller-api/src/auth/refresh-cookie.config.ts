import { ConfigService } from '@nestjs/config';

export type RefreshCookieSameSite = 'strict' | 'lax' | 'none';

export interface RefreshCookieConfiguration {
  name: string;
  options: {
    domain?: string;
    httpOnly: true;
    path: string;
    sameSite: RefreshCookieSameSite;
    secure: boolean;
  };
}

export function getRefreshCookieConfiguration(
  config: ConfigService,
): RefreshCookieConfiguration {
  const domain = config.get<string>('AUTH_REFRESH_COOKIE_DOMAIN');
  return {
    name: config.getOrThrow<string>('AUTH_REFRESH_COOKIE_NAME'),
    options: {
      httpOnly: true,
      secure: config.getOrThrow<boolean>('AUTH_REFRESH_COOKIE_SECURE'),
      sameSite: config.getOrThrow<RefreshCookieSameSite>('AUTH_REFRESH_COOKIE_SAME_SITE'),
      path: config.getOrThrow<string>('AUTH_REFRESH_COOKIE_PATH'),
      ...(domain ? { domain } : {}),
    },
  };
}
