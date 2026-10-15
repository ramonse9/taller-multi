# Validación integral de planes y capacidades

Fecha de validación: 14 de octubre de 2026.

Entorno utilizado: Node.js 22 y PostgreSQL local configurado exclusivamente mediante
`.env.test.local`. No se utilizó ni modificó producción.

## Matriz final

| Funcionalidad                   | Capacidad técnica  | Esencial | Control | Facturación |
| ------------------------------- | ------------------ | :------: | :-----: | :---------: |
| Tablero operativo               | `dashboard`        |    Sí    |   Sí    |     Sí      |
| Clientes y empresas             | `customer_history` |    Sí    |   Sí    |     Sí      |
| Vehículos                       | `vehicle_history`  |    Sí    |   Sí    |     Sí      |
| Marcas y modelos                | `vehicle_catalog`  |    Sí    |   Sí    |     Sí      |
| Órdenes de servicio             | `service_orders`   |    Sí    |   Sí    |     Sí      |
| Conceptos libres                | `free_order_items` |    Sí    |   Sí    |     Sí      |
| Gastos                          | `expenses`         |    Sí    |   Sí    |     Sí      |
| Utilidad, gráficas y Excel      | `profitability`    |    Sí    |   Sí    |     Sí      |
| Usuarios, roles y permisos      | `user_management`  |    Sí    |   Sí    |     Sí      |
| Productos, servicios y unidades | `item_catalog`     |    No    |   Sí    |     Sí      |
| Proveedores                     | `suppliers`        |    No    |   Sí    |     Sí      |
| Compras                         | `purchases`        |    No    |   Sí    |     Sí      |
| Inventario, lotes y FIFO        | `inventory`        |    No    |   Sí    |     Sí      |
| Preparación y simulación fiscal | `invoicing`        |    No    |   No    |     Sí      |

La autorización efectiva continúa siendo compañía activa, suscripción activa, capacidad del plan
y permiso del usuario. Los permisos se conservan al bajar de plan, pero no habilitan una capacidad
no contratada.

## Resultados de pruebas

| Escenario solicitado                   | Evidencia                                                                          |         Resultado          |
| -------------------------------------- | ---------------------------------------------------------------------------------- | :------------------------: |
| Compañías nuevas en los tres planes    | Aprovisionamiento real para `essential`, `control` e `invoicing`                   |          Aprobado          |
| Roles distintos con permisos idénticos | Comparación operativa de `admin` y `user`; permisos automáticos de `company_admin` |          Aprobado          |
| Permisos parciales                     | Guards unitarios e integración de plan, rol y permiso                              |          Aprobado          |
| Acceso directo por URL                 | Guards de ruta para rol, capacidad y permiso; compilación Angular                  |  Aprobado por estructura   |
| Llamadas directas a la API             | Solicitudes contra endpoints permitidos y bloqueados                               |          Aprobado          |
| Subidas y reducciones de plan          | Esencial → Control → Esencial y Control → Facturación → Control                    |          Aprobado          |
| Sesiones abiertas durante un cambio    | El plan nuevo se aplica con el mismo access token; suspensión revoca sesiones      |          Aprobado          |
| Conservación de datos y permisos       | Catálogo, órdenes históricas, documentos y permisos antes/después del cambio       |          Aprobado          |
| Órdenes libres en Esencial             | Flujo completo sin catálogo, compras o inventario                                  |          Aprobado          |
| FIFO en Control                        | Compras, lotes, consumo, reapertura, cancelación y devolución                      |          Aprobado          |
| Facturación simulada                   | Crear, recalcular, emitir y cancelar una simulación                                |          Aprobado          |
| Bloqueo fiscal en Esencial y Control   | Escrituras fiscales rechazadas por capacidad; historial Control en solo lectura    |          Aprobado          |
| Aislamiento entre compañías            | Clientes, usuarios, proveedores, analítica, configuración y documentos             |          Aprobado          |
| Tablero, gastos, utilidad y Excel      | Cálculos por plan, costos FIFO, gastos y archivo mensual                           |          Aprobado          |
| Navegación móvil y escritorio          | Navegación filtrada, diseño responsivo y compilación de producción                 | Revisión estática aprobada |
| Swagger                                | DTO, cookies, permisos, catálogos y endpoints verificados                          |          Aprobado          |
| Migraciones sobre base existente       | Plan `basic` → `essential`, fiscal y facturación simulada sobre tenants heredados  |          Aprobado          |

Resultados técnicos de esta ejecución:

- 39 suites unitarias y 127 pruebas aprobadas.
- 5 suites de integración y 52 pruebas aprobadas con PostgreSQL real local.
- 46 migraciones públicas registradas y bootstrap verificado.
- Build de NestJS, build de Angular y lint de la API aprobados.

## Navegación

- Esencial muestra Tablero, Órdenes, Clientes, Gastos, Utilidad, Usuarios cuando corresponda,
  Seguridad y las acciones permitidas por el perfil.
- Control agrega Productos y servicios, Inventario, Compras y Proveedores.
- Facturación agrega el módulo fiscal cuando existe `invoices.view`.
- Después de bajar de Facturación a Control, Facturación continúa visible únicamente para consulta
  histórica si el usuario conserva `invoices.view`.
- Los accesos directos siguen protegidos por guards del frontend y por capacidad y permiso en la
  API; ocultar navegación no sustituye la autorización del servidor.

## Migraciones

Esta fase de validación no creó ni modificó migraciones. La matriz utiliza las migraciones nuevas
creadas en las fases anteriores y preserva las 46 migraciones públicas registradas.

## Funciones sin validez fiscal

La implementación actual es una simulación interna. Todavía no existen:

- conexión con un PAC;
- carga, custodia o rotación de certificados CSD `.cer` y llaves `.key`;
- uso de contraseñas de CSD o credenciales de PAC;
- generación del XML CFDI 4.0 con validez fiscal;
- cadena original y sellos digitales reales del emisor o del SAT;
- timbrado y UUID fiscal;
- QR fiscal verificable;
- envío, consulta o conciliación ante el SAT;
- cancelación fiscal, motivos de cancelación, aceptación o acuses del SAT;
- complementos de pago;
- representación impresa con datos de un timbre real;
- idempotencia, reintentos y recuperación frente a fallas de un PAC.

Los folios actuales son internos. Los documentos deben seguir mostrando **Simulación sin validez
fiscal** y no deben anunciarse como CFDI emitidos o timbrados.

## Riesgos pendientes

- No existe todavía una suite E2E de navegador. La navegación móvil y de escritorio se validó por
  estructura responsiva, guards y compilación, pero sigue siendo recomendable incorporar pruebas
  visuales automatizadas antes de ampliar considerablemente la interfaz.
- `max_branches` y `max_monthly_invoices` están configurados, pero sus módulos operativos completos
  todavía no aplican esos límites de extremo a extremo.
- Una pestaña abierta puede necesitar recargarse para reflejar inmediatamente el nuevo menú después
  de un cambio de plan. La API sí aplica el nuevo plan en la siguiente petición.
- Facturación permanece limitada a una simulación y no debe comercializarse como facturación
  electrónica real.
