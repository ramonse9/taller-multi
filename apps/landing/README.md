# Landing de Multiservicios 24/7

Sitio comercial público construido con Astro, HTML semántico, CSS3 nativo y JavaScript mínimo.

## Desarrollo

Desde la raíz del monorepo:

```bash
npm run dev:landing
npm run build:landing
npm run preview:landing
```

La compilación estática se genera en `apps/landing/dist`.

## Decisiones

- La landing y la aplicación autenticada se despliegan por separado.
- La identidad, dominios y WhatsApp se centralizan en `src/config/site.ts`.
- Los estilos globales y tokens visuales viven en `src/styles/global.css`.
- La estrategia editorial y SEO vive en `docs/seo-strategy.md`.
