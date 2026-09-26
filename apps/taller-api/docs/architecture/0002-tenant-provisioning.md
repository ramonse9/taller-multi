# ADR 0002: aprovisionamiento transaccional

## Estado

Aceptado.

## Decisión

La creación de compañía toma un bloqueo asesor transaccional por nombre de schema, valida catálogos y existencia lógica/física, inserta la compañía, crea el schema, aplica la migración tenant y registra su versión dentro de una transacción `SERIALIZABLE` y un `QueryRunner` dedicado.

PostgreSQL incluye DDL de schemas y tablas en la transacción. Cualquier error revierte tanto el registro global como el schema incompleto. No se usa `synchronize` ni APIs de sincronización de TypeORM.
