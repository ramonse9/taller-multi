# Taller Web

Frontend Angular nuevo para el backend multi-tenant V2. No comparte código con `p-tc-frontend-v2`; el proyecto anterior permanece como referencia funcional durante la migración.

## Desarrollo

```bash
npm install
npm start
```

La configuración de desarrollo consume `http://localhost:3000/api`. La aplicación incluye login y restauración de sesión mediante `/auth/refresh` y `/auth/me`, onboarding de compañías para el administrador de plataforma, administración de usuarios para el administrador tenant, seguridad de la cuenta, la vertical de clientes y la administración global de marcas y modelos.

El build de producción consume `https://api.multiservicios247.com/api`; el frontend debe publicarse en `https://app.multiservicios247.com` para coincidir con `CORS_ORIGINS` y la política CSRF de la API.

En Render se publica `dist/taller-web/browser` como Static Site. La regla `/*` → `/index.html` debe configurarse como **Rewrite** para que las rutas de Angular funcionen al abrirlas directamente o recargar el navegador. La configuración completa está en [`docs/render-production.md`](../../docs/render-production.md).

La ruta `/vehicle-catalog` está disponible para administradores de plataforma y compañía. Permite buscar, paginar, crear, editar, desactivar y reactivar marcas y sus modelos dependientes. El catálogo comienza vacío y muestra claramente que sus cambios son compartidos entre compañías.

El access token sólo existe en memoria y se adjunta mediante un interceptor. El refresh token permanece inaccesible para JavaScript dentro de una cookie `HttpOnly`; todas las solicitudes a la API habilitan credenciales. Al recargar, la aplicación rota el refresh token, obtiene un access token nuevo y consulta `/auth/me`. Ante un 401, las solicitudes concurrentes comparten una sola renovación y se reintentan una vez.

Las operaciones que modifican la cookie se coordinan entre pestañas con Web Locks. `BroadcastChannel` propaga login y cierre de sesión sin guardar ni transmitir tokens persistentes. Cerrar sesión invoca `/auth/logout`, y cambiar la contraseña limpia el estado local porque la API revoca todas las sesiones. Las rutas y la navegación se limitan por rol: `platform_admin`, `company_admin`, `admin` y `user`.
