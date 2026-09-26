# Taller Web

Frontend Angular nuevo para el backend multi-tenant V2. No comparte código con `p-tc-frontend-v2`; el proyecto anterior permanece como referencia funcional durante la migración.

## Desarrollo

```bash
npm install
npm start
```

La configuración de desarrollo consume `http://localhost:3000/api`. La primera vertical incluye login, restauración de sesión contra `/auth/me`, listado/búsqueda/paginación de clientes, creación, edición y activación/desactivación.

El access token se guarda en `sessionStorage`, se adjunta mediante un interceptor y se descarta ante respuestas 401. Los datos del usuario se restauran siempre desde el servidor y no se consideran válidos únicamente por existir localmente.
