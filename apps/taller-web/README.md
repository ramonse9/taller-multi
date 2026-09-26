# Taller Web

Frontend Angular nuevo para el backend multi-tenant V2. No comparte código con `p-tc-frontend-v2`; el proyecto anterior permanece como referencia funcional durante la migración.

## Desarrollo

```bash
npm install
npm start
```

La configuración de desarrollo consume `http://localhost:3000/api`. La aplicación incluye login y restauración de sesión contra `/auth/me`, onboarding de compañías para el administrador de plataforma, administración de usuarios para el administrador tenant, seguridad de la cuenta y la vertical de clientes.

El access token se guarda en `sessionStorage`, se adjunta mediante un interceptor y se descarta ante respuestas 401. Los datos del usuario se restauran siempre desde el servidor y no se consideran válidos únicamente por existir localmente. Las rutas y la navegación se limitan por rol: `platform_admin`, `company_admin` y `user`.
