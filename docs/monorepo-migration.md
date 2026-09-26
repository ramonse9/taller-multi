# Migración a monorepo

El 26 de septiembre de 2026, los repositorios independientes se consolidaron bajo el repositorio raíz `taller-multi`.

## Historial preservado

Antes de retirar los directorios `.git` internos se crearon y verificaron estos bundles locales:

- `.local-backups/git-history/backend-v1.bundle`
- `.local-backups/git-history/frontend-v2.bundle`

Cada bundle contiene todas las ramas, referencias remotas y etiquetas que estaban disponibles localmente. Para inspeccionar o recuperar uno:

```bash
git bundle verify .local-backups/git-history/backend-v1.bundle
git clone .local-backups/git-history/backend-v1.bundle backend-v1-recovered
```

Los metadatos `.git` originales también permanecen temporalmente en `.local-backups/nested-metadata/`. Todo `.local-backups/` está excluido del repositorio raíz.

## Repositorios remotos anteriores

- Backend V1: `https://github.com/ramonse9/p-tc-backend.git`
- Frontend V2: `https://github.com/ramonse9/p-tc-frontend-v2.git`

El monorepo no usa submódulos ni gitlinks.
