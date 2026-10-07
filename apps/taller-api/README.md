# Taller API

Backend NestJS/PostgreSQL multi-tenant con aislamiento mediante un schema por compañía. El proyecto anterior sólo se usó para entender el dominio; V2 no comparte código, migraciones ni seeds con él.

## Requisitos

- Node.js 22
- PostgreSQL 15 o superior (el entorno local usa PostgreSQL 17)

## Inicio local reproducible

1. Instala PostgreSQL 17 con `brew install postgresql@17` y arráncalo con `brew services start postgresql@17`. Como alternativa, `docker compose up -d postgres` inicia la misma versión en contenedor.
2. Copia `.env.example` a `.env` y reemplaza la contraseña de base de datos, los secretos JWT y las credenciales bootstrap. `.env` está ignorado por Git.
3. Crea el rol y la base indicados por `DATABASE_URL` cuando uses la instalación de Homebrew.
4. Instala dependencias desde la raíz del monorepo con `npm install`.
5. Ejecuta `npm run db:bootstrap` desde la raíz. El comando aplica la migración pública, carga los catálogos de manera idempotente y crea el administrador con Argon2id.
6. Ejecuta `npm run db:verify` para comprobar migraciones, catálogos, aislamiento de tablas tenant y administrador.
7. Inicia con `npm run dev:api` y abre `/docs`.
8. Autentica al administrador en `POST /api/auth/login` y registra la primera compañía en `POST /api/companies`. Este es exactamente el mismo flujo transaccional usado para compañías posteriores.

Los pasos internos también pueden ejecutarse por separado con `npm run db:migrate` y `npm run db:seed`. Repetir `db:bootstrap` no duplica catálogos ni usuarios, y no reemplaza la contraseña de un administrador existente.

## Onboarding y usuarios

`POST /api/companies` recibe los datos de la compañía, el `loginCode` público y un objeto `admin` con `fullName`, `username`, `phone`, `password`, `timezoneCode` y correo opcional. El cliente no elige el schema: el servidor lo genera como `_<consecutivo>_<tipo>_<nombre_comercial>`, por ejemplo `_0003_mul_melkars_diagnostico_automotriz`. Los tipos vigentes son `mul`, `car` y `mec`; el nombre se normaliza sin acentos, con guiones bajos y dentro del límite de 63 caracteres de PostgreSQL.

En una sola transacción registra la compañía, crea y migra su schema, registra la versión tenant y crea el primer `company_admin`. Un fallo en cualquiera de esos pasos revierte todo el onboarding. El consecutivo proviene de una secuencia PostgreSQL para impedir colisiones concurrentes, por lo que puede contener saltos cuando una transacción falla.

Los administradores tenant disponen de:

- `GET /api/users` y `GET /api/users/:id`: listado paginado y detalle, siempre limitados a su compañía.
- `POST /api/users`: creación con rol `admin` o `user`, según la jerarquía del administrador autenticado.
- `PATCH /api/users/:id`: usuario, nombre, celular, correo opcional, zona horaria, rol y activación.
- `DELETE /api/users/:id`: baja lógica para conservar referencias de auditoría.
- `PATCH /api/users/:id/password`: restablecimiento de contraseña por otro administrador.
- `PATCH /api/users/me/password`: cambio personal que exige la contraseña actual.

El código público de compañía se captura durante el onboarding, debe ser único y forma el acceso `usuario@codigo`, por ejemplo `yovany@melkars`. El correo ya no es obligatorio. Los usuarios existentes conservan su correo como acceso compatible y recibieron un `username` durante la migración. El celular es obligatorio para usuarios nuevos y usa formato internacional E.164, por ejemplo `+526671234567`; los registros antiguos sin celular deben completarlo cuando se editen.

La recuperación por OTP, SMS y WhatsApp fue retirada. Si un usuario pierde su contraseña, un administrador le asigna una contraseña temporal mediante `PATCH /api/users/:id/password`: `company_admin` puede restablecer a `admin` y `user`, mientras que `admin` solamente puede restablecer a `user`. La operación reinicia bloqueos e intentos fallidos, revoca todas las sesiones abiertas, activa `must_change_password` y registra una bitácora.

Cuando el único Administrador principal (`company_admin`) pierde su contraseña, el Administrador de plataforma puede restablecerla mediante `PATCH /api/companies/:companyId/admin/password`. Esta acción conserva la información y la jerarquía de la compañía; el Administrador principal deberá definir su contraseña definitiva en el siguiente inicio de sesión.

La API impide que un administrador se desactive o pierda su propio rol y garantiza que cada compañía conserve al menos un administrador activo. Las contraseñas nunca forman parte de una respuesta y se almacenan con Argon2id. Las contraseñas tenant, temporales o definitivas, deben tener entre 6 y 10 caracteres e incluir al menos una letra y un número. Al iniciar sesión con una contraseña temporal, la sesión sólo permite consultar la identidad y establecer una nueva contraseña válida.

Cada login crea una sesión servidor identificada por el `jti` del JWT. Las respuestas autenticadas renuevan el token mediante `X-Session-Token`; el frontend lo guarda automáticamente. Tanto el JWT como la actividad registrada vencen después de 14 días sin uso.

La transición a sesiones persistentes con refresh token dispone de secretos independientes para access y refresh, con vigencias predeterminadas de 15 minutos y 14 días respectivamente. `public.auth_refresh_tokens` conserva la generación, expiración, consumo, revocación y reemplazo de cada token, pero almacena únicamente su hash. La revocación de `auth_sessions` invalida toda la familia asociada. Hasta activar los endpoints de renovación en el siguiente bloque, el login conserva temporalmente el mecanismo anterior mediante `X-Session-Token`.

En desarrollo la cookie se configura como `taller_refresh_token`, sin `Secure`, para funcionar sobre localhost. Producción exige `AUTH_REFRESH_COOKIE_SECURE=true`; se recomienda `__Host-taller_refresh_token` con `Path=/` y sin `Domain`, o `__Secure-taller_refresh_token` cuando se requiera limitar el path. Access y refresh deben usar secretos distintos.

Las órdenes conservan `paid_at` al marcarse como pagadas y lo limpian al volver a pendiente. La analítica distingue la utilidad generada —según el mes de terminación— del resultado cobrado —según el mes en que se registró el cobro—. `GET /api/profitability/analytics?months=6|12&endingMonth=YYYY-MM` entrega una serie mensual continua, resumen del mes final, cobrado contra pendiente y gastos confirmados por categoría. Requiere la capacidad `profitability` y el permiso `profitability.view`.

`synchronize` está deshabilitado y no forma parte de ningún comando.

## Catálogo de vehículos

Las marcas y modelos comienzan vacíos y se almacenan globalmente en `public`, por lo que una captura queda disponible para todas las compañías. Los nombres usan `citext`: no se pueden duplicar por diferencias de mayúsculas, y cada modelo es único dentro de su marca. Las bajas son lógicas para conservar vehículos históricos y cada alta o modificación registra al usuario responsable.

- `GET /api/catalogs/vehicle-brands`: marcas paginadas, con búsqueda y filtro de estado.
- `GET /api/catalogs/vehicle-brands/:id`: detalle de marca.
- `POST`, `PATCH` y `DELETE /api/catalogs/vehicle-brands`: alta, edición/reactivación y desactivación.
- `GET /api/catalogs/vehicle-models?brandId=<uuid>`: modelos paginados de una marca.
- `GET /api/catalogs/vehicle-models/:id`: detalle de modelo.
- `POST`, `PATCH` y `DELETE /api/catalogs/vehicle-models`: alta, edición/reactivación y desactivación.

Todos los usuarios autenticados pueden consultar. Sólo `platform_admin` y `company_admin` pueden modificar. Una marca desactivada no acepta modelos nuevos ni permite reactivar sus modelos.

## Fronteras actuales

La migración tenant base incluye clientes corporativos, clientes, vehículos, productos/servicios, órdenes, notas y conceptos, proveedores, compras, inventario FIFO, cotizaciones, gastos, empleados y nómina. Facturación electrónica, CFDI, PAC, emisores y pagos fiscales no están incluidos.

La primera vertical HTTP operativa es clientes y demuestra el patrón seguro que deben seguir los demás dominios: el schema nunca llega desde headers, query params ni body; se resuelve de nuevo en servidor dentro de un `QueryRunner`, y cada tabla se referencia de forma calificada.

### API de clientes

- `GET /api/clients?page=1&limit=20&search=&isActive=true`: listado filtrado y paginado.
- `GET /api/clients/total`: total de clientes activos.
- `GET /api/clients/:id`: detalle por UUID.
- `POST /api/clients`: creación.
- `PATCH /api/clients/:id`: actualización explícita y activación/desactivación.

La búsqueda trata `%` y `_` como texto, no como comodines introducidos por el cliente. El RFC se normaliza en mayúsculas y es único por tenant. Los campos de auditoría se obtienen exclusivamente del usuario autenticado.

## Pruebas de integración

La suite de integración levanta NestJS y usa PostgreSQL real. Crea una base dedicada, copia `.env.test.example` como `.env.test.local`, ajusta `TEST_DATABASE_URL` y ejecuta desde la raíz:

```bash
npm run test:integration
```

Como protección, la suite rechaza cualquier base cuyo nombre no termine en `_test`. Cada ejecución elimina y reconstruye `public` y los schemas tenant de esa base, aplica la migración y los seeds, y vuelve a dejarla vacía al finalizar. Verifica rollback del aprovisionamiento, schemas duplicados, aislamiento entre tenants, reutilización de conexiones, desactivación de usuarios y compañías, el flujo compañía → usuario → login → clientes, la ausencia del flujo OTP y el restablecimiento administrativo con jerarquía, desbloqueo y revocación de sesiones.

## Seguridad operativa

El propietario de migraciones necesita permiso para crear schemas y extensiones durante bootstrap. Para producción se recomienda separar ese rol del rol de runtime: el runtime sólo necesita conexión, DML sobre `public` y los schemas tenant, y capacidad de aprovisionamiento si la API de plataforma permanecerá habilitada. `REVOKE CREATE ON SCHEMA public FROM PUBLIC` se aplica en la migración inicial.

Ejecuta `npm test`, `npm run lint` y `npm run build` antes de desplegar.
