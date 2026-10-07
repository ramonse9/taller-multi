import { readCookie } from './refresh-cookie';

describe('readCookie', () => {
  it('extrae únicamente la cookie solicitada', () => {
    expect(readCookie('theme=dark; taller_refresh_token=abc_123; locale=es', 'taller_refresh_token'))
      .toBe('abc_123');
  });

  it('no acepta cookies ausentes o mal codificadas', () => {
    expect(readCookie(undefined, 'refresh')).toBeNull();
    expect(readCookie('refresh=%E0%A4%A', 'refresh')).toBeNull();
  });
});
