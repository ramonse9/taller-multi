# Fórmulas canónicas de facturación y conciliación

La facturación simulada es una dimensión documental. No crea ingresos, no registra cobros y no
modifica costos, gastos ni utilidad. Los cálculos financieros continúan teniendo como fuente las
órdenes y los gastos.

## Importes separados

| Importe                | Fuente                               | Uso                                                             |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Importe operativo      | `orders.total`                       | Ingresos, cuentas por cobrar y utilidad                         |
| Costo directo conocido | `orders.total_cost`                  | Utilidad provisional y advertencias de costo incompleto         |
| Subtotal simulado      | `simulated_invoices.subtotal`        | Conciliación documental                                         |
| Impuesto simulado      | `simulated_invoices.transferred_tax` | Conciliación documental, siempre separado del ingreso operativo |
| Total simulado         | `simulated_invoices.total`           | Conciliación documental; nunca se vuelve a sumar al ingreso     |

Aunque el total simulado sea diferente al importe operativo por incluir impuestos, ambos valores
se muestran por separado y nunca se comparan o suman silenciosamente.

## Ejes temporales

Todos los periodos son intervalos semiabiertos: `inicio <= fecha < fin_exclusivo`.

| Eje         | Campo                             | Responde                                              |
| ----------- | --------------------------------- | ----------------------------------------------------- |
| Terminación | `orders.closed_at`                | Qué operación generó ingreso en el periodo            |
| Pago        | `orders.paid_at`                  | Qué dinero fue cobrado durante el periodo             |
| Emisión     | `simulated_invoices.issued_at`    | Qué simulaciones fueron emitidas durante el periodo   |
| Cancelación | `simulated_invoices.cancelled_at` | Qué simulaciones fueron canceladas durante el periodo |
| Gasto       | `expenses.occurred_on`            | Qué gastos confirmados corresponden al periodo        |

La pantalla de Utilidad usa una cohorte de órdenes por fecha de terminación. Dentro de esa cohorte,
“cobrado” significa que la orden está actualmente pagada. El flujo de efectivo cobrado durante un
periodo diferente se calcula exclusivamente con `paid_at` y se mantiene como indicador separado.

## Definiciones

### Pendiente de facturar

Una orden está pendiente de facturar cuando:

1. su estatus actual es `completed`;
2. no tiene una simulación activa en estatus `issued`.

Un borrador activo sigue siendo pendiente y se identifica además como borrador. Una simulación
cancelada o un borrador descartado son historial, por lo que la orden vuelve a estar pendiente si
no existe otro documento activo emitido.

### Simulaciones emitidas

- Por cohorte de terminación: órdenes terminadas en el periodo que actualmente tienen una
  simulación `issued`. Se muestran el importe operativo de la orden y los importes documentales por
  separado.
- Por flujo de emisión: simulaciones actualmente `issued` cuyo `issued_at` pertenece al periodo.
- Una simulación cancelada no forma parte del indicador de emitidas; aparece únicamente en su
  historial y en el flujo de cancelaciones.

### PPD pendiente de cobro

Orden terminada, no pagada, con una simulación activa `issued` cuyo método es `PPD`. La cuenta por
cobrar utiliza `orders.total`; el total con impuestos de la simulación se muestra aparte.

### Utilidad

```text
ingresos_generados = suma(orders.total de órdenes terminadas en el periodo)
costo_directo_conocido = suma(orders.total_cost de esas órdenes)
utilidad_bruta_provisional = ingresos_generados - costo_directo_conocido
gastos_operativos = suma(gastos confirmados ocurridos en el periodo)
utilidad_operativa_provisional = utilidad_bruta_provisional - gastos_operativos
```

Cuando una orden contiene costos desconocidos, la utilidad permanece marcada como incompleta. La
palabra “provisional” indica que el cálculo usa los costos conocidos; emitir, editar, descartar o
cancelar una simulación no cambia ninguna de estas fórmulas.

## Fuente única

`BillingReconciliationService` contiene las definiciones, clasificación temporal y aritmética
monetaria común. Los endpoints del Tablero, Utilidad y Facturación consumen este servicio para
evitar fórmulas divergentes.

## API agregada

Los indicadores se obtienen mediante una sola consulta agregada por solicitud. La consulta no
carga una colección de órdenes ni ejecuta una consulta por cada documento.

- `GET /api/dashboard/summary` incorpora `billingReconciliation` únicamente cuando existe acceso
  actual o histórico a Facturación y el usuario tiene `invoices.view`.
- `GET /api/profitability/billing-reconciliation` exige simultáneamente `profitability.view`,
  `invoices.view`, la capacidad Utilidad y acceso actual o histórico a Facturación.
- `GET /api/invoices/summary` exige `invoices.view` y acceso actual o histórico a Facturación. Su
  respuesta no contiene costos, gastos, utilidad ni márgenes.

Los parámetros `occurredFrom` y `occurredTo` son fechas locales inclusivas. Internamente se
convierten con la zona horaria del usuario a un intervalo UTC semiabierto `[startsAt, endsBefore)`.
Sin parámetros se utiliza el mes local actual completo.

El acceso histórico permite consultar los indicadores después de bajar de Facturación a Control,
pero no habilita creación, edición, emisión o cancelación de simulaciones.

## Evaluación de índices

La consulta real aprovecha los índices existentes:

- `simulated_invoices_open_order_unique` para localizar el documento activo de cada orden;
- `orders_paid_at_idx` para cortes por fecha de pago;
- `expenses_status_date_idx` para gastos confirmados por fecha;
- `simulated_invoices_status_date_idx` para separar estados documentales.

Los indicadores de foto actual requieren revisar el conjunto de órdenes terminadas y se calculan
en la misma pasada que la cohorte del periodo. Por ello no se agregó un índice especulativo para
`closed_at`, `issued_at` o `cancelled_at`: en tenants pequeños y medianos puede aumentar escritura y
almacenamiento sin mejorar el plan elegido por PostgreSQL. Antes de agregarlo se debe capturar
`EXPLAIN (ANALYZE, BUFFERS)` con volumen representativo. Si el volumen demuestra scans costosos,
los candidatos son índices parciales por `orders(closed_at)` para `status='completed'` y por las
fechas de emisión/cancelación para sus estados respectivos.

## Matriz de validación

La validación combina pruebas unitarias del cálculo, pruebas HTTP con PostgreSQL real y pruebas de
presentación en el frontend.

| Escenario                                      | Resultado esperado                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Borrador activo                                | Cuenta como pendiente de facturar y como borrador; nunca como emitido             |
| PUE pagada                                     | Puede estar emitida y no aparece como PPD pendiente de cobro                      |
| PPD pendiente                                  | Conserva por separado el importe operativo por cobrar y el total simulado         |
| PPD pagada                                     | Sale de pendientes de cobro sin cambiar el documento emitido                      |
| Simulación cancelada                           | Sale de emitidas, entra al flujo de cancelaciones y la orden vuelve a pendiente   |
| Borrador descartado                            | Deja de ser activo, conserva historial y permite reabrir la orden                 |
| Orden reabierta                                | No cuenta como terminada, generada o pendiente de facturar                        |
| Nueva emisión después de cancelar              | Solo la nueva activa participa en la cohorte; no duplica la orden                 |
| Terminación en septiembre y emisión en octubre | La operación pertenece a septiembre y la emisión documental a octubre             |
| Reducción de Facturación a Control             | Mantiene consulta histórica; bloquea mutaciones                                   |
| Reducción a Esencial                           | Oculta y bloquea completamente la conciliación de facturación                     |
| Usuario sin `profitability.view`               | Puede consultar Facturación si tiene permiso, pero no la conciliación de Utilidad |
| Segundo tenant                                 | Obtiene únicamente sus propios indicadores, aunque consulte el mismo periodo      |

Las pruebas HTTP fijan fechas históricas directamente en la base de pruebas para comprobar los
ejes temporales sin depender del reloj del sistema. También repiten consultas y transiciones
idempotentes para comprobar que una emisión o cancelación no se contabilice dos veces.

## Validación de presentación

Las secciones de Tablero, Facturación y Utilidad utilizan cuadrículas `mobile-first`, puntos de
quiebre para tableta y escritorio, estados de carga/vacío/error, foco visible y variantes de modo
oscuro. El build de Angular valida todas las plantillas. Las pruebas de regresión verifican que la
conciliación de Utilidad:

- esté encerrada por capacidad de Facturación y por los permisos `invoices.view` y
  `profitability.view`;
- no solicite el endpoint cuando falta alguno de esos accesos;
- separe importes operativos de subtotal, impuestos y total documental;
- no incluya en su modelo de presentación costos, gastos, márgenes o utilidad.

La inspección visual automatizada por navegador todavía no forma parte del repositorio. Antes de
una presentación comercial debe hacerse una revisión manual mínima a 320 px, tableta y escritorio,
en temas claro y oscuro.

## Riesgos y límites conocidos

1. **Volumen por tenant.** La consulta es una sola agregación y evita N+1, pero las métricas de foto
   actual revisan las órdenes terminadas. Debe medirse nuevamente cuando un tenant acumule decenas
   de miles de órdenes.
2. **Índices dependientes del volumen.** No se agregaron índices especulativos. Un índice adicional
   solo debe incorporarse después de observar un plan costoso con `EXPLAIN (ANALYZE, BUFFERS)` sobre
   datos representativos, no sobre fixtures pequeños.
3. **Utilidad provisional.** Los productos libres sin costo conocido mantienen el resultado
   incompleto. La facturación no corrige ni sustituye costos operativos.
4. **Simulación fiscal.** Subtotal, impuestos y total no tienen validez fiscal y no representan XML
   timbrado, PAC, CSD, UUID ni cancelación ante el SAT.
5. **Histórico de plan.** Control conserva lectura histórica solamente si `invoicing` aparece en
   `readOnlyFeatures`; Esencial no recibe ese acceso.
6. **Zona horaria.** Los límites se resuelven con `users.timezone_code`. Cambiar la zona horaria de
   un usuario puede mover eventos cercanos a medianoche entre periodos, sin alterar los timestamps
   almacenados.
