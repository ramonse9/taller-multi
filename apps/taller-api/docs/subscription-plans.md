# Planes y capacidades de Multiservicios 24/7

Este documento es la matriz canónica de los paquetes. La base de datos utiliza los códigos
`essential`, `control` e `invoicing`; `basic` queda reservado exclusivamente para la migración
histórica que lo convierte en `essential`.

## Regla de autorización

Una operación tenant se permite solamente cuando se cumplen las cuatro condiciones:

1. La compañía está activa.
2. La suscripción está activa.
3. El plan incluye la capacidad del módulo.
4. El usuario tiene el permiso de la operación.

`company_admin` recibe automáticamente todos los permisos de usuario, pero continúa limitado por
las capacidades del plan. Los permisos personalizados se conservan al cambiar de plan; una
reducción oculta y bloquea el módulo, pero no borra permisos ni información.

## Matriz funcional

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

## Esencial

Esencial está orientado a talleres que compran insumos conforme los necesitan y no desean llevar
inventario. Las órdenes permiten servicios o productos capturados libremente, cobrables o usados
como insumo. El precio, el costo manual, los gastos y el estatus de cobro alimentan el tablero y los
reportes de utilidad.

Esencial no habilita catálogo de conceptos, proveedores, compras, existencias, lotes ni FIFO.

## Control

Control contiene todo Esencial y agrega catálogo de productos y servicios, proveedores, compras e
inventario. Los productos que controlan existencia generan lotes al confirmar compras y se consumen
por FIFO al terminar una orden. Los conceptos libres continúan disponibles como excepción.

## Facturación

Facturación contiene todo Control y habilita la preparación fiscal. En la fase actual solamente
existe configuración y simulación: cualquier documento debe identificarse como **simulación sin
validez fiscal**. No existe todavía PAC, CSD, XML timbrado, cancelación ante el SAT ni complementos
de pago, por lo que el producto no debe anunciarse como facturación electrónica real.

## Límites actuales

| Límite                  | Esencial | Control | Facturación |
| ----------------------- | -------: | ------: | ----------: |
| Usuarios activos        |        3 |      10 |          25 |
| Sucursales configuradas |        1 |       3 |           5 |
| Facturas mensuales      |        0 |       0 |         100 |

Los valores se conservan por compatibilidad hasta tomar una decisión comercial. El sistema todavía
no cuenta con un módulo de sucursales ni timbrado real, por lo que esos límites no deben anunciarse
como funcionalidades disponibles.

## Brechas encontradas durante la auditoría

- Los campos fiscales del cliente ya existen dentro del formulario general de clientes. La captura
  todavía no está oculta para Esencial y Control; deberá ajustarse al implementar por completo la
  experiencia del paquete Facturación. La configuración del emisor sí está protegida por
  `invoicing`.
- Facturación cuenta con configuración del emisor, borradores desde órdenes, cálculo fiscal
  simulado, representación visual e historial. Continúan pendientes PAC, CSD, XML fiscal,
  timbrado y cancelación ante el SAT.
- `max_branches` y `max_monthly_invoices` están almacenados por compatibilidad, pero no tienen un
  módulo operativo completo que pueda aplicar esos límites.
- Los datos de proveedores, compras e inventario se conservan al reducir el plan, pero sus módulos
  quedan bloqueados fuera de Control y Facturación. La excepción explícita es Facturación →
  Control: las simulaciones existentes permanecen consultables en modo de solo lectura.

## Cambios de plan

- Esencial → Control habilita catálogo, proveedores, compras e inventario inmediatamente.
- Control → Facturación habilita el modo simulación. La creación o emisión continúa bloqueada hasta
  completar la configuración del emisor, activar su perfil y utilizar un receptor fiscal válido.
- Facturación → Control conserva documentos e historial y expone únicamente su consulta. Crear,
  editar, emitir, cancelar o modificar la configuración fiscal queda bloqueado en la API y el
  frontend.
- Control → Esencial conserva catálogos, proveedores, compras, existencias, lotes y movimientos,
  pero oculta sus pantallas y bloquea todas sus operaciones.
- Bajar de plan no elimina clientes, órdenes, catálogos, compras, inventario ni datos fiscales.
- La API rechaza operaciones de módulos fuera del plan aunque se invoque directamente la URL.
- Las copias históricas de conceptos en órdenes permanecen consultables.
- Cada cambio conserva su registro en `company_subscription_history`.
- El plan se consulta desde PostgreSQL en cada petición autenticada; no queda congelado dentro del
  access token. Por ello, un cambio activo se aplica inmediatamente sin cerrar sesiones. Suspender o
  cancelar continúa revocando todas las sesiones de la compañía.
- Las compañías existentes permanecen en su plan actual hasta que el administrador de plataforma
  realice un cambio explícito.
