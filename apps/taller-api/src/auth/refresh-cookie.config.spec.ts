import { ConfigService } from '@nestjs/config';
import { getRefreshCookieConfiguration } from './refresh-cookie.config';

describe('getRefreshCookieConfiguration', () => {
  it('always produces an HttpOnly, host-only cookie when Domain is omitted', () => {
    const config = new ConfigService({
      AUTH_REFRESH_COOKIE_NAME: 'taller_refresh_token',
      AUTH_REFRESH_COOKIE_SECURE: false,
      AUTH_REFRESH_COOKIE_SAME_SITE: 'lax',
      AUTH_REFRESH_COOKIE_PATH: '/api/auth',
    });

    expect(getRefreshCookieConfiguration(config)).toEqual({
      name: 'taller_refresh_token',
      options: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/auth',
      },
    });
  });

  it('keeps the production refresh cookie inaccessible to JavaScript', () => {
    const config = new ConfigService({
      AUTH_REFRESH_COOKIE_NAME: '__Host-taller_refresh_token',
      AUTH_REFRESH_COOKIE_SECURE: true,
      AUTH_REFRESH_COOKIE_SAME_SITE: 'lax',
      AUTH_REFRESH_COOKIE_PATH: '/',
    });

    expect(getRefreshCookieConfiguration(config)).toEqual({
      name: '__Host-taller_refresh_token',
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      },
    });
  });
});
