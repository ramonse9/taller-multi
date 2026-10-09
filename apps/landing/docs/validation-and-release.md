# Validación y publicación de la landing

Fecha de validación local: 9 de octubre de 2026.

## Resultado antes de publicar

- `npm run validate:landing`: correcto.
- Astro: 3 páginas estáticas, 0 errores, 0 advertencias y 0 sugerencias.
- El H1, contenido comercial, FAQ, metadatos y JSON-LD existen en el HTML generado
  sin depender de JavaScript.
- Rutas locales: `/` y `/aviso-de-privacidad/` responden `200`; una ruta inexistente
  responde `404`; `robots.txt` y `sitemap.xml` responden `200`.
- Enlaces internos y fragmentos: correctos mediante validador automático.
- WhatsApp: 10 CTA usan `526675787701`, con mensajes diferenciados para tráfico
  orgánico, Facebook y TikTok.
- Chrome: navegación, menú móvil, FAQ, consentimiento, enlaces internos y consola
  sin errores ni advertencias.
- Safari de escritorio: render correcto y estructura accesible visible en su árbol
  de accesibilidad.
- Responsive: comprobado en 320, 390, 768, 1024, 1440 y 1920 px sin desbordamiento
  horizontal. La prueba móvil fue emulada; conviene hacer una comprobación breve en
  un iPhone y un Android reales después de publicar.
- Teclado: enlace para saltar al contenido, foco visible y menú alcanzable.
- Lighthouse 12.8.2, servidor local de producción:

| Perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Móvil | 100 | 100 | 100 | 100 | 0.8 s | 0.9 s | 0 | 0 ms |
| Escritorio | 100 | 100 | 100 | 100 | 0.2 s | 0.2 s | 0 | 0 ms |

Estas cifras son de laboratorio local y no sustituyen PageSpeed Insights ni los
datos reales de Core Web Vitals después de recibir tráfico.

## Configuración definitiva de Render

Reutilizar el Static Site existente `taller-landing`:

```text
Source:            ramonse9/taller-multi
Branch:            production
Root Directory:    (vacío)
Build Command:     npm ci --include=dev --no-audit && npm run build:landing
Publish Directory: apps/landing/dist
```

Variables:

```text
PUBLIC_CONTACT_EMAIL=contacto@multiservicios247.com
PUBLIC_GOOGLE_SITE_VERIFICATION=<opcional; sólo si Google entrega una metaetiqueta>
```

No agregar una rewrite SPA. Configurar los encabezados documentados en
`render.yaml.example`. Los dominios y DNS ya están funcionando:

- `www.multiservicios247.com` responde `200` por HTTPS.
- `multiservicios247.com` redirige con `301` hacia `www`.
- `www` apunta a `taller-landing.onrender.com`.
- La propiedad de dominio `multiservicios247.com` ya existe en Google Search
  Console; al momento de la revisión todavía no tenía sitemaps enviados.

## Procedimiento de publicación

1. Confirmar que la rama `production` contiene la versión validada.
2. Cambiar el Source del servicio existente al monorepo y aplicar la configuración
   anterior.
3. Esperar un deploy exitoso; la versión anterior debe permanecer disponible
   durante el build.
4. Validar `https://taller-landing.onrender.com` y luego el dominio definitivo.
5. Ejecutar nuevamente Lighthouse o PageSpeed Insights sobre la URL pública.
6. No retirar el despliegue anterior hasta completar la lista posterior.

## Reversión

En **Render → taller-landing → Deploys**, abrir el despliegue estable anterior y
seleccionar **Rollback**. Antes del cambio, el deploy público correspondía al commit
`327c769` del repositorio anterior. No modificar DNS: el mismo Static Site conserva
los dominios y certificados.

## Comprobaciones posteriores a la publicación

- [ ] Inicio, privacidad y 404 responden como se espera.
- [ ] `robots.txt` menciona el sitemap definitivo.
- [ ] `sitemap.xml` incluye inicio y privacidad, pero no la 404.
- [ ] Canonical, title, descripción, Open Graph y Twitter Card usan el dominio `www`.
- [ ] JSON-LD contiene `Organization`, `WebSite` y `SoftwareApplication` y no usa
      `LocalBusiness`.
- [ ] Los CTA abren WhatsApp con el teléfono y mensaje correctos en móvil y escritorio.
- [ ] El enlace de acceso abre `https://app.multiservicios247.com`.
- [ ] No hay errores de consola ni enlaces rotos.
- [ ] TLS es válido y HTTP y el dominio raíz redirigen a `https://www`.
- [ ] PageSpeed Insights se revisó en móvil y escritorio.
- [ ] La tarjeta se probó en el depurador de Facebook y en WhatsApp.
- [ ] La experiencia se comprobó en un iPhone y un Android reales.
- [x] Search Console tiene una propiedad para `multiservicios247.com`.
- [ ] Se envió `https://www.multiservicios247.com/sitemap.xml`.
- [ ] Se solicitó indexación de `/` y `/aviso-de-privacidad/`.
- [ ] Se monitorearon los primeros errores 404, conversiones y Core Web Vitals.
