import * as argon2 from 'argon2';
import { DataSource, QueryRunner } from 'typeorm';
import {
  assertProductionConfirmation,
  changePlatformAdminPassword,
  validatePlatformAdminPassword,
} from './change-platform-admin-password';

describe('platform admin password command', () => {
  it('requires a strong password', () => {
    expect(validatePlatformAdminPassword('abc123')).toEqual([
      'Debe contener entre 12 y 128 caracteres.',
      'Debe incluir al menos una letra mayúscula.',
      'Debe incluir al menos un símbolo.',
    ]);
    expect(validatePlatformAdminPassword('NuevaClave#2026')).toEqual([]);
  });

  it('rejects an incorrect production confirmation', () => {
    expect(() =>
      assertProductionConfirmation('Admin@Example.com ', 'CAMBIAR otro@example.com'),
    ).toThrow('Confirmación de producción incorrecta.');
    expect(() =>
      assertProductionConfirmation('Admin@Example.com ', 'CAMBIAR admin@example.com'),
    ).not.toThrow();
  });

  it('updates the password, resets locks, revokes sessions and writes the audit event', async () => {
    const currentHash = await argon2.hash('ClaveAnterior#2026', { type: argon2.argon2id });
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'admin-id',
          password_hash: currentHash,
          is_active: true,
        },
      ])
      .mockResolvedValue([]);
    const startTransaction = jest.fn().mockResolvedValue(undefined);
    const commitTransaction = jest.fn().mockResolvedValue(undefined);
    const release = jest.fn().mockResolvedValue(undefined);
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction,
      query,
      commitTransaction,
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release,
      isTransactionActive: true,
    } as unknown as QueryRunner;
    const dataSource = {
      createQueryRunner: () => runner,
    } as unknown as DataSource;

    await changePlatformAdminPassword(
      dataSource,
      'ADMIN@EXAMPLE.COM ',
      'NuevaClave#2026',
      'production',
    );

    expect(startTransaction).toHaveBeenCalledWith('SERIALIZABLE');
    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("role = 'platform_admin'"), [
      'admin@example.com',
    ]);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining('failed_login_attempts = 0'), [
      expect.stringMatching(/^\$argon2id\$/),
      'admin-id',
    ]);
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE public.auth_refresh_tokens'),
      ['admin-id'],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('UPDATE public.auth_sessions'),
      ['admin-id'],
    );
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO public.platform_admin_security_events'),
      ['admin-id', 'production'],
    );
    expect(commitTransaction).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });

  it('rolls back when the account does not exist', async () => {
    const rollbackTransaction = jest.fn().mockResolvedValue(undefined);
    const release = jest.fn().mockResolvedValue(undefined);
    const runner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction,
      release,
      isTransactionActive: true,
    } as unknown as QueryRunner;
    const dataSource = {
      createQueryRunner: () => runner,
    } as unknown as DataSource;

    await expect(
      changePlatformAdminPassword(dataSource, 'missing@example.com', 'NuevaClave#2026', 'local'),
    ).rejects.toThrow('No existe un platform_admin con ese correo.');
    expect(rollbackTransaction).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});
