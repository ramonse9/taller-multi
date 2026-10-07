# Despliegue en Render

Esta versión usa dos orígenes HTTPS del mismo sitio:

- Frontend: `https://app.multiservicios247.com`
- API: `https://api.multiservicios247.com`

La cookie de renovación pertenece únicamente al host de la API. No se comparte con el frontend ni queda disponible para JavaScript.

## API (Web Service)

Configura el servicio desde la raíz del monorepo con Node.js 22:

- Build command: `npm ci && npm run build --workspace=apps/taller-api`
- Pre-deploy command: `npm run db:bootstrap`
- Start command: `npm run start:prod --workspace=apps/taller-api`
- Health check path: `/api/health`

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

Usa la URL interna de PostgreSQL cuando ambos servicios estén en la misma región de Render. `DATABASE_SSL=false` corresponde a esa conexión privada; si se usa la URL externa, configura SSL de acuerdo con el certificado entregado por el proveedor.

No asignes valor a `AUTH_REFRESH_COOKIE_DOMAIN`: el prefijo `__Host-` exige `Secure`, `Path=/` y una cookie sin `Domain`. `SameSite=lax` funciona porque `app.multiservicios247.com` y `api.multiservicios247.com` pertenecen al mismo sitio HTTPS. Si alguno se aloja bajo otro dominio, hay que reevaluar `SameSite` antes de desplegar.

Agrega `api.multiservicios247.com` como Custom Domain del Web Service y crea el registro DNS solicitado por Render. Espera a que Render confirme el certificado TLS antes de probar el login.

## Frontend (Static Site)

- Build command: `npm ci && npm run build --workspace=apps/taller-web`
- Publish directory: `apps/taller-web/dist/taller-web/browser`
- Rewrite de SPA: `/*` → `/index.html` con acción `Rewrite`

El build de producción ya apunta a `https://api.multiservicios247.com/api`. Agrega `app.multiservicios247.com` como Custom Domain del Static Site y completa el DNS que indique Render.

## Orden seguro de transición

1. Conserva temporalmente las variables antiguas en Render; la aplicación nueva no las consume.
2. Despliega la API y ejecuta el pre-deploy para aplicar migraciones.
3. Verifica `GET https://api.multiservicios247.com/api/health`.
4. Despliega el frontend y prueba login, recarga, cierre y reapertura del navegador, logout y cambio de contraseña.
5. Confirma en las herramientas del navegador que la cookie tiene `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` y no tiene `Domain`.
6. Comprueba que una petición a `/api/auth/refresh` desde un origen ajeno o sin `Origin`/`Referer` recibe `403`.
7. Sólo entonces elimina de Render `JWT_SECRET`, `JWT_EXPIRES_IN` y cualquier variable del mecanismo anterior.

No elimines `JWT_ACCESS_SECRET` ni `JWT_REFRESH_SECRET`: son las variables vigentes. Cambiar cualquiera de ellas invalida las sesiones relacionadas y requiere un nuevo inicio de sesión.
