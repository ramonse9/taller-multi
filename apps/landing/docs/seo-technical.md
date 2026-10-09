# SEO técnico, medición y publicación

## Salida indexable

La landing se genera como HTML estático. El contenido comercial, los encabezados, las preguntas frecuentes, los metadatos y los datos estructurados están presentes sin ejecutar JavaScript.

Rutas indexables:

- `https://www.multiservicios247.com/`
- `https://www.multiservicios247.com/aviso-de-privacidad/`

La página `404` utiliza `noindex, nofollow` y no aparece en el sitemap.

## Metadatos y recursos

- Canonical principal: `https://www.multiservicios247.com/`
- Sitemap: `https://www.multiservicios247.com/sitemap.xml`
- Robots: `https://www.multiservicios247.com/robots.txt`
- Imagen social: `https://www.multiservicios247.com/social/og-multiservicios-247.png`
- JSON-LD: `Organization`, `WebSite` y `SoftwareApplication`
- No se utiliza `LocalBusiness`.

Google solicita una oferta con precio para que `SoftwareApplication` sea elegible para su resultado enriquecido específico. No se agregó `offers` porque todavía no existe un precio público confirmado; inventar un precio sería incorrecto. El marcado se conserva para describir semánticamente el producto y deberá ampliarse únicamente cuando exista información comercial real.

La imagen social mide 1200 × 630 px y los metadatos incluyen sus dimensiones para que los consumidores puedan reservar el espacio. Las vistas del producto están construidas con HTML y CSS; actualmente no existen capturas reales que deban descargarse dentro del contenido.

## Google Search Console

1. Publicar primero la landing, `robots.txt` y `sitemap.xml` en el dominio definitivo.
2. Crear una propiedad de dominio para `multiservicios247.com`. La verificación requiere agregar el registro TXT que proporcione Search Console en el proveedor DNS.
3. Si no se dispone de acceso DNS, crear temporalmente una propiedad con prefijo de URL para `https://www.multiservicios247.com/` y utilizar alguno de sus métodos admitidos.
4. Abrir **Sitemaps**, enviar `sitemap.xml` y confirmar que la lectura termine sin errores.
5. Usar **Inspección de URLs** para `/` y `/aviso-de-privacidad/`, probar la URL publicada y solicitar indexación.
6. No enviar `/404/` ni las rutas de la aplicación autenticada en este sitemap comercial.
7. Revisar periódicamente **Indexación**, **Experiencia** y **Core Web Vitals** después de acumular datos reales.

Si se usa una propiedad con prefijo de URL y Google entrega una etiqueta HTML, puede configurarse el contenido de esa etiqueta en `PUBLIC_GOOGLE_SITE_VERIFICATION`. No hace falta para la propiedad de dominio verificada mediante DNS.

Search Console y el sitemap ayudan al descubrimiento, pero no garantizan que Google indexe una URL.

Referencias oficiales:

- [Agregar una propiedad a Search Console](https://support.google.com/webmasters/answer/34592)
- [Crear y enviar un sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Directrices generales de datos estructurados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Datos estructurados para aplicaciones de software](https://developers.google.com/search/docs/appearance/structured-data/software-app)

## Validación después del despliegue

- Probar la página principal en Rich Results Test y revisar que el JSON-LD se pueda analizar. La ausencia de un resultado enriquecido no implica que `Organization`, `WebSite` o `SoftwareApplication` sean inválidos.
- Validar la URL publicada con Schema Markup Validator.
- Ejecutar PageSpeed Insights en móvil y escritorio.
- Compartir una URL de prueba en el depurador de Facebook para actualizar la tarjeta Open Graph.
- Confirmar que WhatsApp muestre el título, la descripción y la imagen social.

Validación local:

```bash
npm run build:landing
npm run validate:seo
```

El validador revisa contenido estático, canonical, metadatos sociales, tipos JSON-LD, `robots.txt`, sitemap, 404 y dimensiones de la imagen social.

## Rendimiento y Core Web Vitals

- No se cargan frameworks de interfaz en el navegador.
- La tipografía utiliza fuentes del sistema; no hay solicitudes de fuentes externas.
- La imagen Open Graph no forma parte del render visible.
- Los componentes visuales de la portada son HTML y CSS, por lo que no causan desplazamientos por imágenes sin dimensiones.
- El JavaScript se limita a atribución de WhatsApp y preferencia de analítica.
- No se hacen afirmaciones de puntuaciones Lighthouse antes de medir la versión pública.

Después del despliegue deben revisarse LCP, INP y CLS con PageSpeed Insights y, cuando exista tráfico suficiente, con los datos de campo de Search Console.

## Analítica, cookies y consentimiento

La landing no carga GA4 ni Meta Pixel por defecto. La persona visitante puede elegir entre “Solo necesarias” y “Aceptar analítica”. La preferencia se guarda en `localStorage` con la clave `ms247_analytics_consent`.

Los eventos externos de conversión solamente se emiten cuando la preferencia es `analytics`:

- GA4: `generate_lead`
- Google Tag Manager: `whatsapp_click`
- Meta Pixel: `Contact`

Antes de configurar identificadores de medición se debe conservar la carga condicionada al consentimiento y revisar el aviso de privacidad con los datos legales definitivos del responsable.
