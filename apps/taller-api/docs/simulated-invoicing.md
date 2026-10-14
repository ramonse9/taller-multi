# Arquitectura de facturación simulada

## Alcance de esta fase

Esta fase prepara la configuración fiscal del emisor y los controles de acceso para una demostración de facturación. Todo documento que se agregue posteriormente bajo este modo será una **simulación sin validez fiscal**.

La implementación actual:

- conserva la configuración dentro del schema PostgreSQL de cada compañía;
- valida la identidad fiscal del emisor contra el tipo de persona y el catálogo público de regímenes fiscales;
- permite únicamente la moneda MXN;
- reserva una serie y un consecutivo interno para futuras simulaciones;
- separa la habilitación comercial del módulo de la captura del perfil fiscal;
- audita los cambios del perfil y del modo de operación.

No genera un CFDI, no timbra, no consulta al SAT y no produce XML fiscal.

## Límites de seguridad y validez

No se almacenan ni se solicitan:

- certificados `.cer`;
- llaves privadas `.key`;
- contraseñas de CSD;
- credenciales, tokens o secretos de un PAC.

No existe todavía integración con PAC, CSD, XML, sello digital, UUID fiscal, QR fiscal, cancelación ante el SAT, complemento de pago ni consulta de estatus fiscal. Los folios de esta fase son internos y no representan folios fiscales. Ningún PDF o representación futura deberá presentarse como factura válida mientras el modo siga siendo `simulation`.

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

La respuesta tenant incluye `isIssuerProfileComplete`, `missingFields` y `validationIssues`. Los códigos son estables para que el frontend pueda presentar mensajes específicos sin interpretar texto libre.

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
