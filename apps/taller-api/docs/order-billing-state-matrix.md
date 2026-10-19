# Estados independientes de órdenes y facturación simulada

Las órdenes mantienen tres dimensiones diferentes. Ninguna se calcula copiando el estado de otra:

| Dimensión   | Fuente                              | Estados                                        |
| ----------- | ----------------------------------- | ---------------------------------------------- |
| Operación   | `orders.status`                     | `in_progress`, `completed`, `cancelled`        |
| Cobro       | `orders.is_paid` y `orders.paid_at` | `pending`, `paid`                              |
| Facturación | Relación con `simulated_invoices`   | `not_invoiced`, `draft`, `issued`, `cancelled`, `discarded` |

`liquidada` no es un estado de facturación. Una simulación emitida puede corresponder a una orden
pendiente de cobro y una orden pagada puede permanecer sin factura.

## Resumen de facturación de una orden

El API deriva el resumen al consultar la orden; no guarda columnas duplicadas en `orders`.

| Situación documental                                     | `billingStatus`     | `activeInvoiceId`   | Metadatos de factura                                             |
| -------------------------------------------------------- | ------------------- | ------------------- | ---------------------------------------------------------------- |
| La orden nunca ha tenido simulaciones                    | `not_invoiced`      | `null`              | `null`                                                           |
| Existe un borrador activo                                | `draft`             | Id del borrador     | Método de pago disponible; serie, folio y emisión todavía `null` |
| Existe una simulación emitida                            | `issued`            | Id de la simulación | Serie, folio, emisión y método de pago                           |
| Solamente existen simulaciones canceladas                | `cancelled`         | `null`              | Datos de la cancelación más reciente para consulta histórica     |
| Solamente existen borradores descartados                 | `discarded`         | `null`              | Datos del borrador más reciente para consulta histórica          |
| Existe historial cancelado y una nueva simulación activa | Estado de la activa | Id de la activa     | Datos de la activa                                               |

La restricción única parcial `simulated_invoices_open_order_unique` garantiza que solamente exista
una simulación activa (`draft` o `issued`) por orden. Las canceladas y los borradores descartados no
se eliminan.

## Reglas de consistencia y transiciones

| Acción | Permitida cuando | Rechazada cuando |
| --- | --- | --- |
| Crear borrador | Orden `completed` y sin factura activa | Orden en proceso/cancelada o factura activa |
| Emitir PUE | Borrador activo y orden pagada | Orden pendiente, borrador descartado o simulación cancelada |
| Emitir PPD | Borrador activo, aunque la orden esté pendiente | Orden no terminada o documento terminal |
| Marcar pagada | Orden no cancelada y con precios completos | Orden cancelada o ya pagada |
| Regresar a pendiente | Sin simulación PUE emitida | Existe una PUE emitida; debe cancelarse primero |
| Reabrir/cancelar orden terminada | Sin borrador ni simulación emitida | Existe documento activo; el error incluye su id |
| Descartar borrador | Documento `draft` | Una simulación emitida debe cancelarse |
| Cancelar simulación | Documento `issued` | Un borrador debe descartarse |

Emitir, cancelar o descartar no modifica el cobro. Cambiar el cobro no crea ni modifica facturas.
Las repeticiones de emisión, cancelación y descarte ya completadas son idempotentes y no duplican
eventos. Las operaciones que relacionan orden y factura bloquean primero la orden y después el
documento para evitar carreras.

## Cobro dentro de la factura

Las respuestas de facturación incluyen `collectionStatus` y `orderPaidAt`, derivados de la orden
relacionada. Estos valores no se almacenan en `simulated_invoices` y no representan un estado fiscal.

## Alcance de esta fase

Esta matriz describe documentos internos de simulación sin validez fiscal. No existen UUID fiscal,
XML, sellos, CSD, PAC, timbrado, cancelación ante el SAT ni complementos de pago.
