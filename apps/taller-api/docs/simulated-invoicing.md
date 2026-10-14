# Arquitectura de facturación simulada

## Alcance de esta fase

Esta fase prepara la configuración fiscal del emisor, los controles de acceso y documentos internos para una demostración de facturación. Todo documento creado bajo este modo es una **simulación sin validez fiscal**.

La implementación actual:

- conserva la configuración dentro del schema PostgreSQL de cada compañía;
- valida la identidad fiscal del emisor contra el tipo de persona y el catálogo público de regímenes fiscales;
- permite únicamente la moneda MXN;
- reserva una serie y un consecutivo interno para futuras simulaciones;
- separa la habilitación comercial del módulo de la captura del perfil fiscal;
- audita los cambios del perfil y del modo de operación;
- crea borradores desde órdenes terminadas y copia receptor, conceptos cobrables e importes;
- calcula IVA soportado por el simulador, permite editar el borrador, emitirlo y cancelarlo;
- conserva instantáneas e historial aun cuando cambien los datos operativos originales.

No genera un CFDI, no timbra, no consulta al SAT y no produce XML fiscal. La representación visual y cada respuesta del documento muestran `Simulación sin validez fiscal`.

## Límites de seguridad y validez

No se almacenan ni se solicitan:

- certificados `.cer`;
- llaves privadas `.key`;
- contraseñas de CSD;
- credenciales, tokens o secretos de un PAC.

No existe todavía integración con PAC, CSD, XML, sello digital, UUID fiscal, QR fiscal, cancelación ante el SAT, complemento de pago ni consulta de estatus fiscal. Los folios de esta fase son internos y no representan folios fiscales. La aplicación no utiliza las expresiones “timbrada” o “CFDI emitido” para estos documentos. Ningún PDF o representación futura deberá presentarse como factura válida mientras el modo siga siendo `simulation`.

## Modelo multi-tenant

Cada schema tenant contiene una única fila en `invoice_settings` (`id = 1`) y su propia bitácora `invoice_settings_events`. No hay perfiles fiscales de emisores compartidos entre compañías.

Campos principales:

- `mode`: `disabled` o `simulation`;
- `fiscal_name`, `tax_id`, `fiscal_regime_code`, `fiscal_postal_code`;
- `default_series` y `next_internal_folio`;
- `prices_include_tax`;
- `currency_code`, restringido a `MXN`;
- `is_active`;
- usuario y fechas de auditoría.

La preparación fiscal se calcula en cada lectura. No se almacena un booleano derivado que pueda quedar desactualizado.

Cada tenant conserva además:

- `simulated_invoices`: encabezado e instantáneas del emisor y receptor;
- `simulated_invoice_items`: conceptos cobrables e impuestos simulados;
- `simulated_invoice_events`: creación, edición, emisión y cancelación de la simulación.

La serie y el folio interno se asignan al emitir la simulación. No se reutilizan como UUID ni como folio fiscal. Solamente puede existir una simulación no cancelada por orden.

## Catálogos y cálculo soportado

Los catálogos públicos de objeto de impuesto, impuesto, tipo de factor, tasa, forma y método de pago y exportación se revisaron el 14 de octubre de 2026 contra el portal de factura electrónica y los catálogos CFDI publicados por el SAT. La vigencia oficial y el soporte del simulador son conceptos separados mediante `is_active` y `simulation_supported`.

Fuentes oficiales:

- https://www.sat.gob.mx/minisitio/Factura/default.htm
- https://wwwmatnp.sat.gob.mx/consultas/35025/formato-de-factura-electronica-%28anexo-20%29

El subconjunto inicial del simulador permite:

- objeto `01` (no objeto) y `02` (sí objeto);
- IVA `002` con tasa 16 %, 8 %, 0 % o factor Exento;
- métodos PUE y PPD;
- formas 01, 02, 03, 04, 28 y 99;
- exportación 01;
- moneda MXN.

Una clave oficial puede estar vigente y aun así no estar soportada. En ese caso se rechaza con un mensaje explícito; no se intenta un cálculo parcial. Cuando los precios incluyen impuesto, la base se obtiene a partir del total capturado. Cuando no lo incluyen, el impuesto se suma a la base.

## Responsabilidades

El `platform_admin` puede cambiar solamente `mode` mediante el endpoint de plataforma. Para habilitar `simulation`, la compañía debe estar activa y tener una suscripción Facturación activa. Esta operación no actualiza silenciosamente RFC, nombre fiscal, régimen ni código postal.

El `company_admin` puede modificar el perfil fiscal del emisor y su estatus operativo. Un `admin` puede consultarlo si tiene `invoices.view`, pero no modificarlo aunque alguien le asigne `invoices.configure`: el límite de rol se valida en la API.

Los planes Esencial y Control no pueden consultar ni operar el módulo. Un cambio de plan no elimina la configuración guardada; solamente deja la capacidad inaccesible mientras el plan no incluya `invoicing`.

## Permisos

- `invoices.view`
- `invoices.create`
- `invoices.edit`
- `invoices.simulate_issue`
- `invoices.cancel_simulation`
- `invoices.configure`

El `company_admin` recibe todos los permisos de manera automática por la política general del sistema. Los permisos aparecen en el catálogo para perfiles `admin` y `user`, pero las operaciones sensibles conservan además su límite de rol.

## Endpoints actuales

- `GET /api/invoices/settings`: consulta tenant, requiere plan Facturación e `invoices.view`.
- `PATCH /api/invoices/settings`: actualiza el perfil; requiere plan Facturación, rol `company_admin` e `invoices.configure`.
- `GET /api/companies/:companyId/invoicing-mode`: consulta operativa para `platform_admin`.
- `PATCH /api/companies/:companyId/invoicing-mode`: habilita o deshabilita simulación para `platform_admin`.
- `GET /api/invoices/catalogs`: catálogos utilizados por el simulador.
- `GET /api/invoices`: listado paginado de simulaciones.
- `GET /api/invoices/:id`: representación e historial.
- `POST /api/invoices`: crea un borrador desde una orden terminada.
- `PATCH /api/invoices/:id`: edita encabezado e impuestos de un borrador.
- `POST /api/invoices/:id/issue-simulation`: asigna serie y folio interno.
- `POST /api/invoices/:id/cancel-simulation`: cancela únicamente el documento interno.

La respuesta tenant incluye `isIssuerProfileComplete`, `missingFields` y `validationIssues`. Los códigos son estables para que el frontend pueda presentar mensajes específicos sin interpretar texto libre. Todos los endpoints de documentos exigen plan `invoicing`, modo `simulation`, configuración activa y el permiso específico de la operación.

## Preparación para una integración fiscal futura

Antes de emitir CFDI reales será necesario diseñar por separado:

1. proveedor PAC y sus ambientes de prueba/producción;
2. custodia cifrada y rotación de CSD;
3. catálogos completos de impuestos, objeto de impuesto, formas y métodos de pago;
4. generación y validación de XML CFDI 4.0;
5. timbrado, cancelación y acuses;
6. idempotencia, conciliación y recuperación ante fallas del PAC;
7. representación impresa con datos reales del timbre;
8. políticas de retención, privacidad y acceso a secretos fiscales.

La existencia de esta configuración no debe interpretarse como que esos puntos ya están implementados.
