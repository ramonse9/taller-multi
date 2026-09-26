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

`POST /api/companies` recibe los datos de la compañía y un objeto `admin` con `fullName`, `email`, `password` y `timezoneCode`. En una sola transacción registra la compañía, crea y migra su schema, registra la versión tenant y crea el primer `company_admin`. Un fallo en cualquiera de esos pasos revierte todo el onboarding.

Los administradores tenant disponen de:

- `GET /api/users` y `GET /api/users/:id`: listado paginado y detalle, siempre limitados a su compañía.
- `POST /api/users`: creación con rol `user` o `company_admin`.
- `PATCH /api/users/:id`: nombre, correo, zona horaria, rol y activación.
- `DELETE /api/users/:id`: baja lógica para conservar referencias de auditoría.
- `PATCH /api/users/:id/password`: restablecimiento de contraseña por otro administrador.
- `PATCH /api/users/me/password`: cambio personal que exige la contraseña actual.

La API impide que un administrador se desactive o pierda su propio rol y garantiza que cada compañía conserve al menos un administrador activo. Las contraseñas nunca forman parte de una respuesta y se almacenan con Argon2id.

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

## Seguridad operativa

El propietario de migraciones necesita permiso para crear schemas y extensiones durante bootstrap. Para producción se recomienda separar ese rol del rol de runtime: el runtime sólo necesita conexión, DML sobre `public` y los schemas tenant, y capacidad de aprovisionamiento si la API de plataforma permanecerá habilitada. `REVOKE CREATE ON SCHEMA public FROM PUBLIC` se aplica en la migración inicial.

Ejecuta `npm test`, `npm run lint` y `npm run build` antes de desplegar.
