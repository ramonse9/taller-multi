# Estados independientes de órdenes y facturación simulada

Las órdenes mantienen tres dimensiones diferentes. Ninguna se calcula copiando el estado de otra:

| Dimensión   | Fuente                              | Estados                                        |
| ----------- | ----------------------------------- | ---------------------------------------------- |
| Operación   | `orders.status`                     | `in_progress`, `completed`, `cancelled`        |
| Cobro       | `orders.is_paid` y `orders.paid_at` | `pending`, `paid`                              |
| Facturación | Relación con `simulated_invoices`   | `not_invoiced`, `draft`, `issued`, `cancelled` |

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
| Existe historial cancelado y una nueva simulación activa | Estado de la activa | Id de la activa     | Datos de la activa                                               |

La restricción única parcial `simulated_invoices_open_order_unique` garantiza que solamente exista
una simulación con estado distinto de `cancelled` por orden. Las canceladas no se eliminan.

## Cobro dentro de la factura

Las respuestas de facturación incluyen `collectionStatus` y `orderPaidAt`, derivados de la orden
relacionada. Estos valores no se almacenan en `simulated_invoices` y no representan un estado fiscal.

## Alcance de esta fase

Esta matriz describe documentos internos de simulación sin validez fiscal. No existen UUID fiscal,
XML, sellos, CSD, PAC, timbrado, cancelación ante el SAT ni complementos de pago.
