import { existsSync } from 'node:fs';
import { stdin, stdout } from 'node:process';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import * as argon2 from 'argon2';
import { config as loadEnvironment } from 'dotenv';
import { DataSource } from 'typeorm';

type CommandEnvironment = 'local' | 'production';

interface PlatformAdminRow {
  id: string;
  password_hash: string;
  is_active: boolean;
}

const MINIMUM_PASSWORD_LENGTH = 12;
const MAXIMUM_PASSWORD_LENGTH = 128;

export function validatePlatformAdminPassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < MINIMUM_PASSWORD_LENGTH || password.length > MAXIMUM_PASSWORD_LENGTH) {
    errors.push(
      `Debe contener entre ${MINIMUM_PASSWORD_LENGTH} y ${MAXIMUM_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (!/[a-z]/.test(password)) errors.push('Debe incluir al menos una letra minúscula.');
  if (!/[A-Z]/.test(password)) errors.push('Debe incluir al menos una letra mayúscula.');
  if (!/\d/.test(password)) errors.push('Debe incluir al menos un número.');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Debe incluir al menos un símbolo.');
  return errors;
}

export function assertProductionConfirmation(email: string, confirmation: string): void {
  const phrase = `CAMBIAR ${email.trim().toLowerCase()}`;
  if (confirmation !== phrase) throw new Error('Confirmación de producción incorrecta.');
}

export async function changePlatformAdminPassword(
  dataSource: DataSource,
  email: string,
  password: string,
  environment: CommandEnvironment,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('El correo del administrador es obligatorio.');

  const validationErrors = validatePlatformAdminPassword(password);
  if (validationErrors.length > 0) {
    throw new Error(`La contraseña no cumple los requisitos:\n- ${validationErrors.join('\n- ')}`);
  }

  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction('SERIALIZABLE');
  try {
    const users = (await runner.query(
      `SELECT id, password_hash, is_active
       FROM public.users
       WHERE lower(email) = $1
         AND role = 'platform_admin'
         AND company_id IS NULL
       FOR UPDATE`,
      [normalizedEmail],
    )) as PlatformAdminRow[];
    const user = users[0];
    if (!user) throw new Error('No existe un platform_admin con ese correo.');
    if (!user.is_active) throw new Error('El platform_admin se encuentra desactivado.');
    if (await argon2.verify(user.password_hash, password)) {
      throw new Error('La nueva contraseña debe ser diferente a la contraseña actual.');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await runner.query(
      `UPDATE public.users
       SET password_hash = $1,
           failed_login_attempts = 0,
           locked_until = NULL,
           must_change_password = FALSE,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id],
    );
    await runner.query(
      `UPDATE public.auth_refresh_tokens
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE session_id IN (
         SELECT id FROM public.auth_sessions WHERE user_id = $1
       )`,
      [user.id],
    );
    await runner.query(
      `UPDATE public.auth_sessions
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE user_id = $1`,
      [user.id],
    );
    await runner.query(
      `INSERT INTO public.platform_admin_security_events(
         target_user_id, event_type, source, environment
       ) VALUES ($1, 'password_changed', 'local_admin_command', $2)`,
      [user.id, environment],
    );
    await runner.commitTransaction();
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }
}

function commandEnvironment(args: string[]): CommandEnvironment {
  const value = args.find((argument) => argument.startsWith('--environment='))?.split('=')[1];
  if (value === 'local' || value === 'production') return value;
  throw new Error('Usa --environment=local o --environment=production.');
}

function apiDirectory(): string {
  return resolve(__dirname, '../..');
}

function loadCommandEnvironment(environment: CommandEnvironment): void {
  const filename = environment === 'production' ? '.env.production.local' : '.env';
  const path = resolve(apiDirectory(), filename);
  if (!existsSync(path)) throw new Error(`No existe ${path}.`);
  const result = loadEnvironment({ path, override: true, quiet: true });
  if (result.error) throw result.error;
}

async function promptLine(question: string): Promise<string> {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    return await terminal.question(question);
  } finally {
    terminal.close();
  }
}

async function promptHidden(question: string): Promise<string> {
  if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) {
    throw new Error('La contraseña sólo puede capturarse desde una terminal interactiva.');
  }
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  return await new Promise<string>((resolvePassword, rejectPassword) => {
    let password = '';
    const cleanup = (): void => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };
    const onData = (value: string): void => {
      for (const character of value) {
        if (character === '\u0003') {
          cleanup();
          rejectPassword(new Error('Operación cancelada.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          resolvePassword(password);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          password = password.slice(0, -1);
          continue;
        }
        const codePoint = character.codePointAt(0) ?? 0;
        if (codePoint >= 32 && codePoint !== 127) password += character;
      }
    };
    stdin.on('data', onData);
  });
}

async function main(): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Este comando requiere una terminal interactiva.');
  }

  const environment = commandEnvironment(process.argv.slice(2));
  loadCommandEnvironment(environment);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL no está configurada.');
  const parsedDatabaseUrl = new URL(databaseUrl);

  stdout.write(
    `\nCambio seguro de contraseña del platform_admin\n` +
      `Entorno: ${environment}\n` +
      `Base: ${parsedDatabaseUrl.hostname}/${parsedDatabaseUrl.pathname.replace(/^\//, '')}\n\n`,
  );

  const email = (await promptLine('Correo del platform_admin: ')).trim().toLowerCase();
  const password = await promptHidden('Nueva contraseña (entrada oculta): ');
  const confirmation = await promptHidden('Confirma la nueva contraseña (entrada oculta): ');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');

  const passwordErrors = validatePlatformAdminPassword(password);
  if (passwordErrors.length > 0) {
    throw new Error(`La contraseña no cumple los requisitos:\n- ${passwordErrors.join('\n- ')}`);
  }

  if (environment === 'production') {
    const phrase = `CAMBIAR ${email}`;
    const typedPhrase = await promptLine(`Escribe "${phrase}" para confirmar producción: `);
    assertProductionConfirmation(email, typedPhrase);
  }

  const { default: dataSource } = await import('../database/public-data-source');
  await dataSource.initialize();
  try {
    await changePlatformAdminPassword(dataSource, email, password, environment);
  } finally {
    await dataSource.destroy();
  }

  stdout.write(
    '\nContraseña actualizada. Todas las sesiones del platform_admin fueron revocadas.\n',
  );
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.';
    process.stderr.write(`\n${message}\n`);
    process.exitCode = 1;
  });
}
