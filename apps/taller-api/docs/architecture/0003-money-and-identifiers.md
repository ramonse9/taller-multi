# ADR 0003: importes e identificadores

## Estado

Aceptado.

## Decisión

Las identidades internas usan UUID generado por PostgreSQL y los folios visibles usan `IDENTITY`; nunca se calcula `MAX(id) + 1`. Los importes usan `numeric(14,2)` y cantidades `numeric(12,3)`.

El driver `pg` entrega `numeric` como texto. La API conservará esos valores como `string` y no los convertirá a `number`; los cálculos de dinero ocurren en PostgreSQL o, cuando haga falta en aplicación, mediante una biblioteca decimal explícita.
