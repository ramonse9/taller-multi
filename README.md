# Taller Multi

Monorepo de la nueva plataforma multi-tenant para talleres y compañías de multiservicios.

## Estructura

```text
apps/
├── taller-api/         NestJS + PostgreSQL (aplicación activa)
├── taller-web/         Angular (aplicación activa)
└── legacy/
    ├── backend-v1/     Backend anterior, sólo como referencia
    └── frontend-v2/    Frontend anterior, sólo como referencia
```

Los proyectos dentro de `legacy/` no son workspaces y no deben recibir nuevas funcionalidades.

## Requisitos

- Node.js 22
- PostgreSQL 15 o superior

## Comandos desde la raíz

```bash
npm run dev:api
npm run dev:web
npm run db:bootstrap
npm run db:verify
npm run build
npm test
npm run test:integration
npm run lint
```

Los detalles de configuración y bootstrap están en los README de [taller-api](apps/taller-api/README.md) y [taller-web](apps/taller-web/README.md).

Los schemas tenant se asignan automáticamente con el formato `_<consecutivo>_<tipo>_<nombre_comercial>`; no se capturan manualmente desde el frontend.

## Historial anterior

Los repositorios Git que existían dentro de `apps/` fueron convertidos en directorios normales. Antes de la conversión se generaron bundles completos y verificados en `.local-backups/git-history/`; esa carpeta es local y está ignorada por Git. Los repositorios remotos originales no fueron modificados.

La antigua clave de Google Cloud Vision fue retirada del frontend legacy. Debe revocarse o restringirse también desde Google Cloud, ya que continúa presente en el historial de su repositorio anterior.
