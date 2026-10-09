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

## Contacto y medición

- WhatsApp utiliza `https://wa.me/526675787701` y un mensaje codificado.
- `utm_source=facebook`, `fbclid`, `utm_source=tiktok` y `ttclid` seleccionan un mensaje identificable; el resto utiliza el mensaje orgánico.
- Antes de abrir WhatsApp se emite `generate_lead` para GA4 cuando existe `gtag`, `whatsapp_click` para `dataLayer` cuando no existe y `Contact` para Meta Pixel cuando existe `fbq`.
- También se publica el evento de navegador `landing:whatsapp-click` para integraciones posteriores.
- La landing no carga Google Analytics ni Meta Pixel por sí sola: sus identificadores deben configurarse durante el despliegue cuando estén disponibles.
- El correo alternativo se muestra únicamente cuando `PUBLIC_CONTACT_EMAIL` contiene una dirección comercial confirmada.
