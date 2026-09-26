# ADR 0001: un schema PostgreSQL por compañía

## Estado

Aceptado.

## Decisión

`public` contiene sólo identidad global, compañías, usuarios, catálogos globales y versiones de schemas. Cada compañía obtiene un schema privado con toda su operación. El servidor resuelve el schema usando `JWT.sub → public.users.company_id → public.companies.schema_name`; ningún endpoint operativo acepta un schema del cliente.

Las consultas tenant usan nombres completamente calificados. No se modifica `search_path`, por lo que una conexión devuelta al pool no conserva contexto tenant. Los identificadores de schema se normalizan, validan y escapan; los valores siguen parametrizados.

## Consecuencias

El aprovisionamiento y las migraciones tenant necesitan una ruta dinámica propia. A cambio, el aislamiento es visible, auditable y verificable en PostgreSQL. Las referencias a usuarios globales se hacen mediante claves foráneas hacia `public.users`.
