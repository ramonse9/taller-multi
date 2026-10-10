# Cambio y recuperación de contraseña del platform_admin

Este procedimiento está reservado para la persona que administra la plataforma. Se ejecuta desde
una terminal local con acceso autorizado a PostgreSQL y no está expuesto mediante la API ni el
frontend.

El comando no solicita la contraseña actual, por lo que sirve tanto para un cambio programado como
para recuperar el acceso cuando se olvidó la contraseña. La posesión de las credenciales de base de
datos es el control administrativo que autoriza la operación.

## Garantías de seguridad

- La contraseña se captura únicamente desde una terminal interactiva y nunca se muestra.
- No existe una opción para pasarla como argumento, variable de entorno o entrada redirigida.
- Se solicita dos veces y debe contener entre 12 y 128 caracteres, con mayúscula, minúscula, número
  y símbolo.
- Sólo se modifica una cuenta activa con rol `platform_admin`, sin compañía y con el correo indicado.
- El hash se genera con Argon2id.
- La actualización, el desbloqueo, la revocación de sesiones y la bitácora se guardan en una sola
  transacción serializable.
- No se almacena la contraseña ni se incluye en la salida del comando.

## Preparación

Ejecuta los comandos desde la raíz de `taller-multi`. Instala dependencias y compila la API antes de
usar el procedimiento de producción:

```bash
npm install
npm run build --workspace=apps/taller-api
```

La migración `PlatformAdminSecurityEvents1700000035000` debe estar aplicada. En local se instala con
el bootstrap habitual:

```bash
npm run db:bootstrap
```

En Render, el pre-deploy `npm run db:bootstrap:prod` la aplica antes de publicar la nueva versión de
la API. No ejecutes el cambio contra producción antes de que ese despliegue termine correctamente.

## Cambio en la base local

El comando local carga `apps/taller-api/.env`:

```bash
npm run platform-admin:password:local
```

También se conserva `npm run platform-admin:password` como alias del comando local.

El proceso muestra el entorno y el host/nombre de la base, solicita el correo del `platform_admin`,
la nueva contraseña y su confirmación. Revisa siempre la base mostrada antes de continuar.

## Cambio o recuperación en producción

El comando de producción carga exclusivamente `apps/taller-api/.env.production.local`, que debe
contener la URL externa de PostgreSQL y `DATABASE_SSL=true`:

```bash
npm run platform-admin:password:prod
```

Antes de conectarse exige escribir exactamente:

```text
CAMBIAR correo-del-administrador
```

Si la frase, el correo, las contraseñas o las reglas de fortaleza no coinciden, el proceso termina
sin modificar la base.

Cuando concluye correctamente:

1. Cambia el hash y limpia `failed_login_attempts` y `locked_until`.
2. Revoca todas las filas vigentes de `auth_sessions` y `auth_refresh_tokens` de la cuenta.
3. Registra `password_changed` en `public.platform_admin_security_events`.
4. Obliga a iniciar una sesión nueva con la contraseña recién capturada.

## Verificación posterior

1. Comprueba que una sesión anterior ya no pueda renovar ni consultar `/api/auth/me`.
2. Comprueba que la contraseña anterior sea rechazada.
3. Inicia sesión con la nueva contraseña.
4. Opcionalmente revisa la bitácora sin consultar hashes:

```sql
SELECT event.event_type, event.source, event.environment, event.created_at
FROM public.platform_admin_security_events event
JOIN public.users user_account ON user_account.id = event.target_user_id
WHERE user_account.email = 'correo-del-administrador'
ORDER BY event.created_at DESC;
```

## Protección del archivo de producción

`.env.production.local` contiene acceso directo a producción. Nunca debe copiarse a Render, enviarse
por mensajería ni agregarse al repositorio. Puedes comprobar que Git lo ignora con:

```bash
git check-ignore -v apps/taller-api/.env.production.local
```

La salida debe señalar una regla `.env.*`. Si el comando no produce salida, detente y corrige el
`.gitignore` antes de continuar.

No compartas la nueva contraseña por chat. Cuando otra persona ayude a ejecutar el procedimiento,
la contraseña debe introducirla directamente el propietario en la terminal.

## Errores esperados

- `Este comando requiere una terminal interactiva`: se intentó ejecutar desde una tubería o job sin
  TTY.
- `No existe un platform_admin con ese correo`: el correo no corresponde a la cuenta de plataforma.
- `El platform_admin se encuentra desactivado`: primero debe revisarse la activación de la cuenta.
- `relation public.platform_admin_security_events does not exist`: falta aplicar la migración nueva.
- `Confirmación de producción incorrecta`: la frase de autorización no coincide exactamente.
