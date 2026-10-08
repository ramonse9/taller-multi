# Despliegue en Render

Esta versión usa dos orígenes HTTPS del mismo sitio:

- Frontend: `https://app.multiservicios247.com`
- API: `https://api.multiservicios247.com`

La cookie de renovación pertenece únicamente al host de la API. No se comparte con el frontend ni queda disponible para JavaScript.

La plantilla [render.yaml.example](../render.yaml.example) contiene estos valores en formato Blueprint, pero se mantiene como ejemplo de manera intencional. Como V1 ya existe en Render, importa los valores en los servicios actuales desde el Dashboard; no crees un Blueprint hasta confirmar que sus nombres coinciden exactamente, porque Render podría crear servicios nuevos. La base PostgreSQL existente no se declara en la plantilla y nunca debe sustituirse.

## API (Web Service)

Configura el servicio desde la raíz del monorepo con Node.js 22.23.2, fijado en `.node-version`, `.nvmrc` y el rango `22.x` de `package.json`:

- Build command: `npm ci && npm run build --workspace=apps/taller-api`
- Pre-deploy command: `npm run db:bootstrap:prod`
- Start command: `npm run start:prod --workspace=apps/taller-api`
- Health check path: `/api/health`

Mantén la raíz del servicio en la raíz del repositorio. Render proporciona `PORT` automáticamente; la API escucha ese puerto en `0.0.0.0`. Configura un tiempo de apagado de 30 segundos para permitir que los hooks de NestJS cierren las conexiones.

El build genera los scripts de migración; el pre-deploy ejecuta `node dist/database/bootstrap.js` y no depende de `ts-node` ni de otras dependencias de desarrollo. Antes de guardar las variables en Render puedes validarlas localmente, sin conectarte a PostgreSQL ni imprimir secretos:

```bash
TALLER_ENV_FILE=.env.production.local npm run config:verify:prod --workspace=apps/taller-api
```

Después del bootstrap, `npm run db:verify:prod` comprueba migraciones, catálogos y administrador contra la base configurada. La API atiende `SIGTERM` mediante los hooks de cierre de NestJS, lo que permite cerrar conexiones antes de que Render retire una instancia.

## Reinicio único de V1 a V2

El reinicio conserva el recurso PostgreSQL, su URL y sus credenciales. Solamente elimina `public` y los schemas tenant V1 identificados mediante `pub_companias`, para después instalar V2. No guardes las variables `TALLER_RESET_*` permanentemente en Render.

Primero detén V1 o escala su servicio a cero. El script se niega a ejecutar mientras detecte otras conexiones abiertas con el mismo usuario de PostgreSQL. Desde un Shell/Job que use las variables de la API compilada, ejecuta primero la previsualización:

```bash
npm run db:reset-v1:prod
```

La previsualización no modifica datos y muestra el nombre real de la base, el rol y los schemas que serían eliminados. Revisa el resultado y ejecuta una sola vez sustituyendo `<nombre-exacto>`:

```bash
TALLER_RESET_EXECUTE=true \
TALLER_RESET_CONFIRMATION=RESET_V1_AND_INSTALL_V2 \
TALLER_RESET_DATABASE=<nombre-exacto> \
npm run db:reset-v1:prod
```

El script exige simultáneamente `NODE_ENV=production`, el marcador V1 `public.pub_companias`, ausencia de estructuras V2, la frase exacta, el nombre exacto consultado desde PostgreSQL y cero conexiones adicionales. Luego ejecuta migraciones, seeds, crea el administrador de plataforma y corre la verificación V2. Si únicamente deseas volver a verificar después del corte, usa `npm run db:verify:prod`.

No configures este reinicio destructivo como Pre-deploy recurrente. Después del corte único, conserva solamente `npm run db:bootstrap:prod` como Pre-deploy idempotente.

Variables requeridas en Render:

```dotenv
NODE_ENV=production
DATABASE_URL=<Internal Database URL de la base PostgreSQL existente>
DATABASE_SSL=false
CORS_ORIGINS=https://app.multiservicios247.com
JWT_ISSUER=taller-api
JWT_AUDIENCE=taller-web
JWT_ACCESS_SECRET=<secreto aleatorio exclusivo de al menos 32 caracteres>
JWT_REFRESH_SECRET=<otro secreto aleatorio de al menos 32 caracteres>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=14d
AUTH_REFRESH_COOKIE_NAME=__Host-taller_refresh_token
AUTH_REFRESH_COOKIE_SECURE=true
AUTH_REFRESH_COOKIE_SAME_SITE=lax
AUTH_REFRESH_COOKIE_PATH=/
AUTH_REFRESH_COOKIE_DOMAIN=
AUTH_REQUIRE_TRUSTED_ORIGIN=true
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=100
SENSITIVE_RATE_LIMIT_TTL_MS=60000
SENSITIVE_RATE_LIMIT_MAX=3
TRUST_PROXY_HOPS=1
BOOTSTRAP_ADMIN_EMAIL=<correo del administrador de plataforma>
BOOTSTRAP_ADMIN_PASSWORD=<contraseña inicial segura>
```

El archivo [apps/taller-api/.env.production.example](../apps/taller-api/.env.production.example) contiene la misma lista sin secretos reales. `PORT` no necesita crearse manualmente en Render. Marca `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` y la contraseña bootstrap inicial como secretos; los dos secretos JWT deben ser diferentes. `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` sólo son necesarios cuando la base todavía no tiene un administrador de plataforma activo. Después de verificar el primer acceso pueden retirarse: los pre-deploy posteriores continuarán aplicando migraciones y seeds sin reemplazar sus credenciales.

Usa la URL interna de PostgreSQL cuando ambos servicios estén en la misma región de Render. `DATABASE_SSL=false` corresponde a esa conexión privada; si se usa la URL externa, configura SSL de acuerdo con el certificado entregado por el proveedor.

No asignes valor a `AUTH_REFRESH_COOKIE_DOMAIN`: el prefijo `__Host-` exige `Secure`, `Path=/` y una cookie sin `Domain`. `SameSite=lax` funciona porque `app.multiservicios247.com` y `api.multiservicios247.com` pertenecen al mismo sitio HTTPS. Si alguno se aloja bajo otro dominio, hay que reevaluar `SameSite` antes de desplegar.

Agrega `api.multiservicios247.com` como Custom Domain del Web Service y crea el registro DNS solicitado por Render. Para este subdominio será un `CNAME` llamado `api` apuntando al hostname `*.onrender.com` exacto que muestre el servicio, sin `https://` ni rutas. Espera a que Render marque el dominio como verificado y emita el certificado TLS antes de probar el login.

## Frontend (Static Site)

- Build command: `npm ci && npm run build --workspace=apps/taller-web`
- Publish directory: `apps/taller-web/dist/taller-web/browser`
- Rewrite de SPA: `/*` → `/index.html` con acción `Rewrite`

El build de producción ya apunta a `https://api.multiservicios247.com/api`. Agrega `app.multiservicios247.com` como Custom Domain del Static Site y completa el DNS que indique Render.

Para `app`, crea otro `CNAME` apuntando al hostname `*.onrender.com` del Static Site. Elimina registros `A`, `AAAA` o `CNAME` anteriores que entren en conflicto. Si el DNS está en Cloudflare, realiza primero la verificación con el proxy desactivado (DNS only) y actívalo después únicamente si se ha validado la configuración de cookies y caché.

Render administra y renueva los certificados TLS y redirige HTTP a HTTPS. No cargues certificados manualmente. No pruebes autenticación en el dominio personalizado hasta que ambos certificados estén activos: la cookie `Secure` no debe relajarse para sortear una propagación DNS incompleta.

## Navegación SPA

Configura en el Static Site una regla de tipo **Rewrite**:

```text
Source:      /*
Destination: /index.html
```

Debe ser `Rewrite`, no `Redirect`. Así, rutas directas como `/orders`, `/clients/<id>` o `/account`, además de una recarga del navegador, entregan `index.html` y Angular resuelve la navegación. Los archivos reales generados (`.js`, `.css` y otros assets) conservan prioridad sobre esta regla.

Agrega también estos encabezados al Static Site:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

## Comprobaciones de dominio

Después de que el DNS se propague, verifica:

```bash
curl -i https://api.multiservicios247.com/api/health
curl -I https://app.multiservicios247.com/login
curl -I https://app.multiservicios247.com/orders
```

El health check debe responder `200` con `{"status":"ok"}`; una falla de PostgreSQL debe producir `503`. Las rutas del frontend deben responder `200` y servir la aplicación, no un `404`. Una petición CORS desde `https://app.multiservicios247.com` debe incluir `Access-Control-Allow-Origin` con ese origen exacto y `Access-Control-Allow-Credentials: true`; un origen diferente debe rechazarse.

## Orden seguro de transición

1. Conserva temporalmente las variables antiguas en Render; la aplicación nueva no las consume.
2. Detén V1 y ejecuta la previsualización y el reinicio único descritos arriba.
3. Copia los comandos y variables definitivos al Web Service existente, agrega `api.multiservicios247.com` y despliega la API; los despliegues posteriores usan el pre-deploy idempotente.
4. Ejecuta `npm run db:verify:prod` y verifica `GET https://api.multiservicios247.com/api/health` después de que TLS esté activo.
5. Configura el Static Site existente, su rewrite SPA y `app.multiservicios247.com`; despliega y prueba login, recarga, rutas directas, cierre y reapertura del navegador, logout y cambio de contraseña.
6. Confirma en las herramientas del navegador que la cookie tiene `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` y no tiene `Domain`.
7. Comprueba que una petición a `/api/auth/refresh` desde un origen ajeno o sin `Origin`/`Referer` recibe `403`.
8. Sólo entonces elimina de Render `JWT_SECRET`, `JWT_EXPIRES_IN` y cualquier variable del mecanismo anterior.

No elimines `JWT_ACCESS_SECRET` ni `JWT_REFRESH_SECRET`: son las variables vigentes. Cambiar cualquiera de ellas invalida las sesiones relacionadas y requiere un nuevo inicio de sesión.
