import { tokenDurationMilliseconds } from './token-duration';

describe('tokenDurationMilliseconds', () => {
  it('convierte minutos y días a milisegundos', () => {
    expect(tokenDurationMilliseconds('15m')).toBe(15 * 60_000);
    expect(tokenDurationMilliseconds('14d')).toBe(14 * 86_400_000);
  });

  it('rechaza duraciones ambiguas o nulas', () => {
    expect(() => tokenDurationMilliseconds('14 days')).toThrow('Duración de token inválida');
    expect(() => tokenDurationMilliseconds('0d')).toThrow('Duración de token inválida');
  });
});
