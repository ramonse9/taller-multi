# Taller API

Backend NestJS/PostgreSQL multi-tenant con aislamiento mediante un schema por compañía. El proyecto anterior sólo se usó para entender el dominio; V2 no comparte código, migraciones ni seeds con él.

## Requisitos

- Node.js 22
- PostgreSQL 15 o superior (el entorno local usa PostgreSQL 17)

## Inicio local reproducible

1. Instala PostgreSQL 17 con `brew install postgresql@17` y arráncalo con `brew services start postgresql@17`. Como alternativa, `docker compose up -d postgres` inicia la misma versión en contenedor.
2. Copia `.env.example` a `.env` y reemplaza la contraseña de base de datos, `JWT_SECRET` y las credenciales bootstrap. `.env` está ignorado por Git.
3. Crea el rol y la base indicados por `DATABASE_URL` cuando uses la instalación de Homebrew.
4. Instala dependencias desde la raíz del monorepo con `npm install`.
5. Ejecuta `npm run db:bootstrap` desde la raíz. El comando aplica la migración pública, carga los catálogos de manera idempotente y crea el administrador con Argon2id.
6. Ejecuta `npm run db:verify` para comprobar migraciones, catálogos, aislamiento de tablas tenant y administrador.
7. Inicia con `npm run dev:api` y abre `/docs`.
8. Autentica al administrador en `POST /api/auth/login` y registra la primera compañía en `POST /api/companies`. Este es exactamente el mismo flujo transaccional usado para compañías posteriores.

Los pasos internos también pueden ejecutarse por separado con `npm run db:migrate` y `npm run db:seed`. Repetir `db:bootstrap` no duplica catálogos ni usuarios, y no reemplaza la contraseña de un administrador existente.

## Onboarding y usuarios

`POST /api/companies` recibe los datos de la compañía y un objeto `admin` con `fullName`, `username`, `password`, `timezoneCode` y, opcionalmente, `email` y `phone`. El cliente no elige el schema: el servidor lo genera como `_<consecutivo>_<tipo>_<nombre_comercial>`, por ejemplo `_0003_mul_melkars_diagnostico_automotriz`. Los tipos vigentes son `mul`, `car` y `mec`; el nombre se normaliza sin acentos, con guiones bajos y dentro del límite de 63 caracteres de PostgreSQL.

En una sola transacción registra la compañía, crea y migra su schema, registra la versión tenant y crea el primer `company_admin`. Un fallo en cualquiera de esos pasos revierte todo el onboarding. El consecutivo proviene de una secuencia PostgreSQL para impedir colisiones concurrentes, por lo que puede contener saltos cuando una transacción falla.

Los administradores tenant disponen de:

- `GET /api/users` y `GET /api/users/:id`: listado paginado y detalle, siempre limitados a su compañía.
- `POST /api/users`: creación con rol `user` o `company_admin`.
- `PATCH /api/users/:id`: usuario, nombre, celular, correo opcional, zona horaria, rol y activación.
- `DELETE /api/users/:id`: baja lógica para conservar referencias de auditoría.
- `PATCH /api/users/:id/password`: restablecimiento de contraseña por otro administrador.
- `PATCH /api/users/me/password`: cambio personal que exige la contraseña actual.

Cada compañía recibe también un código público único derivado de su nombre comercial. Los usuarios tenant inician sesión como `usuario@codigo`, por ejemplo `yovany@melkars`; el correo ya no es obligatorio. Los códigos repetidos reciben un sufijo numérico. Los usuarios existentes conservan su correo como acceso compatible y reciben un `username` durante la migración. El celular usa formato internacional E.164, por ejemplo `+526671234567`.

La recuperación móvil está disponible en `POST /api/auth/password-recovery/request`, `verify` y `complete`. El usuario elige SMS o WhatsApp, recibe un OTP de seis dígitos válido durante 10 minutos y, al comprobarlo, el teléfono queda verificado. El token posterior para definir la contraseña también dura 10 minutos, sólo puede usarse una vez y revoca las sesiones anteriores.

El servidor permite cinco intentos por OTP, exige 60 segundos antes de reenviar y limita cada usuario a tres envíos por hora. Los códigos se guardan como HMAC, nunca como texto legible, y las respuestas de solicitud no confirman si el usuario o el teléfono existen.

Para desarrollo, `MOBILE_PROVIDER=console` muestra el código en el log y en la pantalla local. Este modo se rechaza automáticamente en producción. Para envíos reales configura `MOBILE_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y el remitente `TWILIO_SMS_FROM` o `TWILIO_WHATSAPP_FROM`. `OTP_SECRET` debe ser un secreto distinto del JWT; si se omite se usa `JWT_SECRET` como respaldo.

La API impide que un administrador se desactive o pierda su propio rol y garantiza que cada compañía conserve al menos un administrador activo. Las contraseñas nunca forman parte de una respuesta y se almacenan con Argon2id. Las contraseñas tenant, temporales o definitivas, deben tener entre 6 y 10 caracteres e incluir al menos una letra y un número. Al iniciar sesión con una contraseña temporal, la sesión sólo permite consultar la identidad y establecer una nueva contraseña válida.

Cada login crea una sesión servidor identificada por el `jti` del JWT. Las respuestas autenticadas renuevan el token mediante `X-Session-Token`; el frontend lo guarda automáticamente. Tanto el JWT como la actividad registrada vencen después de 14 días sin uso.

`synchronize` está deshabilitado y no forma parte de ningún comando.

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

Como protección, la suite rechaza cualquier base cuyo nombre no termine en `_test`. Cada ejecución elimina y reconstruye `public` y los schemas tenant de esa base, aplica la migración y los seeds, y vuelve a dejarla vacía al finalizar. Verifica rollback del aprovisionamiento, schemas duplicados, aislamiento entre tenants, reutilización de conexiones, desactivación de usuarios y compañías, el flujo compañía → usuario → login → clientes y la recuperación móvil con límites de reenvío, verificación OTP y cambio de contraseña.

## Seguridad operativa

El propietario de migraciones necesita permiso para crear schemas y extensiones durante bootstrap. Para producción se recomienda separar ese rol del rol de runtime: el runtime sólo necesita conexión, DML sobre `public` y los schemas tenant, y capacidad de aprovisionamiento si la API de plataforma permanecerá habilitada. `REVOKE CREATE ON SCHEMA public FROM PUBLIC` se aplica en la migración inicial.

Ejecuta `npm test`, `npm run lint` y `npm run build` antes de desplegar.
