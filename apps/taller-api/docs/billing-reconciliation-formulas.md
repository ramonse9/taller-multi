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
monetaria común. Los endpoints del Tablero, Utilidad y Facturación deberán consumir este servicio
en los siguientes bloques para evitar fórmulas divergentes.
