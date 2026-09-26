# Taller API

Backend NestJS/PostgreSQL multi-tenant con aislamiento mediante un schema por compañía. El proyecto anterior sólo se usó para entender el dominio; V2 no comparte código, migraciones ni seeds con él.

## Requisitos

- Node.js 22
- PostgreSQL 15 o superior (el entorno local usa PostgreSQL 17)

## Inicio local reproducible

1. Copia `.env.example` a `.env` y reemplaza secretos y contraseña de base de datos.
2. Inicia PostgreSQL: `docker compose up -d postgres`.
3. Instala dependencias: `npm install`.
4. Define `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` sólo en el entorno.
5. Ejecuta `npm run bootstrap`. Esto aplica la migración pública y crea el administrador inicial con Argon2id.
6. Inicia con `npm run start:dev` y abre `/docs`.
7. Autentica al administrador en `POST /api/auth/login` y registra la primera compañía en `POST /api/companies`. Este es exactamente el mismo flujo transaccional usado para compañías posteriores.

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
