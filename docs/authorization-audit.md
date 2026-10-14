# Auditoría y política de autorización

Fecha de revisión: 13 de octubre de 2026.

## Objetivo

Evitar que dos usuarios tenant con los mismos permisos operativos encuentren formularios, botones o resultados distintos solamente por tener los roles `admin` y `user`.

Esta política no incluye a `platform_admin` en la jerarquía tenant. Ese rol opera la plataforma, las compañías y las suscripciones, y conserva rutas propias.

## Regla general

El acceso efectivo a una operación tenant debe calcularse con estas condiciones:

1. La sesión y la compañía están activas.
2. El plan contratado habilita la capacidad correspondiente.
3. El usuario posee el permiso de la acción.
4. La entidad está en un estado que admite la acción.
5. Solamente para administración de usuarios o configuración sensible, la jerarquía del rol admite actuar sobre el objetivo.

El frontend puede ocultar una acción para mejorar la experiencia, pero la API siempre debe volver a validar estas condiciones.

## Responsabilidad de cada mecanismo

### Acciones gobernadas por permisos

No deben depender directamente de si el usuario es `admin` o `user`:

- Consultar el tablero.
- Consultar, crear, editar o desactivar clientes.
- Consultar, crear, editar o desactivar vehículos.
- Consultar, crear, editar, cambiar estatus, cancelar, cobrar o agregar notas a órdenes.
- Consultar o administrar marcas y modelos.
- Consultar o administrar productos, servicios y unidades.
- Consultar costos cuando corresponda.
- Consultar o mover inventario y realizar ajustes.
- Consultar o administrar proveedores.
- Consultar, crear, editar, confirmar o cancelar compras.
- Consultar, crear, editar o cancelar gastos.
- Consultar utilidad.
- Consultar y operar facturación simulada cuando el plan y el modo la habiliten.

Si un `admin` y un `user` poseen el mismo permiso operativo, deben ver la misma pantalla, los mismos campos y las mismas acciones para esa capacidad.

### Acciones gobernadas por jerarquía

Estas sí requieren el rol además del permiso:

- Crear, editar, activar, desactivar o restablecer la contraseña de otros usuarios.
- Asignar roles, plantillas y permisos.
- Evitar que un administrador conceda permisos que no posee.
- Proteger al último `company_admin` activo.
- Modificar la configuración fiscal del emisor.
- Administrar compañías, suscripciones y usuarios desde la plataforma.

### Acciones solamente descriptivas

Mostrar el nombre del rol, su insignia o la explicación de a quién puede administrar puede depender de `role`. Estas diferencias no deben cambiar las operaciones del negocio.

## Matriz esperada por rol tenant

| Regla | `company_admin` | `admin` | `user` |
| --- | --- | --- | --- |
| Operación diaria | Acceso automático a todos los permisos disponibles en el plan | Solamente permisos asignados | Solamente permisos asignados |
| Misma experiencia con el mismo permiso operativo | Sí | Sí | Sí |
| Consultar usuarios | Sí | Con `users.view` | No asignable |
| Crear, editar, activar o desactivar usuarios | Puede administrar `admin` y `user` | Puede administrar solamente `user` | No |
| Administrar otro `admin` | Sí | No | No |
| Administrar un `company_admin` | Protegido; no forma parte de la operación ordinaria entre usuarios | No | No |
| Asignar permisos | Puede asignar permisos tenant | Solamente a `user` y sin conceder permisos que él no posee | No |
| Recibir permisos administrativos | Automáticos | `users.view`, `users.manage` y `permissions.manage` obligatorios | Prohibidos |
| Restablecer contraseña temporal | A `admin` y `user` | Solamente a `user` | No |
| Configurar emisor fiscal | Sí | No, aunque pueda consultar información autorizada | No |
| Protección del último administrador principal | No puede ser desactivado, degradado ni eliminado si es el último | No aplica | No aplica |

Las plantillas Recepción, Mecánico, Almacén y Administración son puntos de partida. No constituyen roles ni deben introducir condiciones ocultas en formularios.

## Matriz operativa esperada

| Módulo | Permiso de consulta | Permisos de acción | Dependencia adicional válida |
| --- | --- | --- | --- |
| Tablero | `dashboard.view` | — | El contenido interno se limita con permisos de órdenes, cobros, gastos, inventario y utilidad |
| Clientes | `clients.view` | `clients.create`, `clients.edit`, `clients.deactivate` | Plan con historial de clientes |
| Vehículos | `vehicles.view` | `vehicles.create`, `vehicles.edit`, `vehicles.deactivate` | Plan con historial de clientes |
| Órdenes | `orders.view` | `orders.create`, `orders.edit`, `orders.change_status`, `orders.cancel`, `orders.manage_payment`, `orders.add_notes` | Plan con órdenes; cancelar también exige `orders.cancel` |
| Marcas y modelos | `vehicle_catalog.view` | `vehicle_catalog.manage` | Ninguna diferencia por rol tenant |
| Productos y servicios | `catalog.view` | `catalog.manage`, `catalog.view_costs` | Plan Control o Facturación |
| Inventario | `inventory.view` | `inventory.move`, `inventory.adjust` | Plan Control o Facturación |
| Proveedores | `suppliers.view` | `suppliers.manage` | Plan Control o Facturación |
| Compras | `purchases.view` | `purchases.create`, `purchases.edit`, `purchases.confirm`, `purchases.cancel` | Catálogo, costos y proveedores según el flujo |
| Gastos | `expenses.view` | `expenses.create`, `expenses.edit`, `expenses.cancel` | Plan Control o Facturación |
| Utilidad | `profitability.view` | — | Plan Control o Facturación |
| Usuarios | `users.view` | `users.manage`, `permissions.manage` | Jerarquía `company_admin -> admin -> user` |
| Facturación simulada | `invoices.view` | `invoices.create`, `invoices.edit`, `invoices.simulate_issue`, `invoices.cancel_simulation` | Plan Facturación y modo simulación |
| Configuración fiscal | Consulta autorizada | `invoices.configure` | La modificación queda reservada a `company_admin` |

## Condiciones por rol localizadas

### API: condiciones legítimas

- `PermissionGuard` otorga permisos automáticos a `company_admin` y permite el contexto especial de `platform_admin`.
- `SubscriptionGuard` excluye a `platform_admin` porque no opera bajo una suscripción tenant.
- Los controladores de compañías, suscripciones y usuarios de plataforma exigen `platform_admin`.
- La administración tenant de usuarios y permisos acepta `company_admin` y `admin`, y los servicios aplican la jerarquía sobre el usuario objetivo.
- El restablecimiento de contraseñas sigue la misma jerarquía.
- La modificación de la configuración fiscal del emisor está restringida a `company_admin`.

Estas condiciones deben conservarse.

### Frontend: condiciones legítimas

- Separar la navegación de `platform_admin` de la navegación tenant.
- Restringir la pantalla de usuarios a `company_admin` y `admin` con `users.view`.
- Mostrar nombres, insignias y explicaciones distintas según el rol.
- Aplicar la jerarquía al ofrecer edición, activación, desactivación, contraseña temporal y permisos de otros usuarios.

### Frontend: condición que debe eliminarse

`app-shell.component.html` mantiene un menú completo para `company_admin` y otro para `admin`/`user`. Los árboles ya se desviaron:

- Un `user` con `vehicle_catalog.view` puede abrir la ruta, pero no ve **Marcas y modelos** en el menú.
- La numeración y la posición de **Seguridad** cambian mediante condiciones de rol.
- Cada módulo nuevo debe agregarse dos veces y puede quedar visible para un rol pero no para otro.

La navegación tenant debe ser única y generarse por capacidad: plan más permiso. El rol solamente debe intervenir en las opciones administrativas descritas en la matriz.

### Rutas: condición redundante

Las rutas operativas declaran repetidamente los tres roles `company_admin`, `admin` y `user`, además de plan y permiso. No causa por sí sola una diferencia, pero mezcla alcance tenant con autorización de negocio.

Se recomienda conservar una única validación de “usuario tenant” y dejar la autorización operativa al plan y al permiso. Las rutas de plataforma y administración de usuarios sí deben conservar restricciones de rol explícitas.

## Hallazgos sobre permisos

### Prioridad alta

1. **Captura de costos de una orden durante edición.** La creación usa `orders.create`, pero la edición vuelve a exigir `orders.create` si se captura un costo. El frontend también decide si muestra ese campo únicamente con `orders.create`. Un usuario con `orders.edit` y sin `orders.create` recibe una experiencia incompleta. La regla esperada es:
   - Al crear: `orders.create` permite capturar costos manuales.
   - Al editar: `orders.edit` permite capturar costos manuales.
   - `catalog.view_costs` sigue protegiendo costos de catálogo, FIFO, lotes y datos calculados sensibles.

2. **Navegación de marcas y modelos.** Debe mostrarse a cualquier usuario tenant con `vehicle_catalog.view`. Crear o modificar sigue exigiendo `vehicle_catalog.manage`.

3. **Detalle de cliente demasiado restrictivo.** La ruta exige simultáneamente `clients.view`, `vehicles.view` y `vehicle_catalog.view`. Consultar los datos de un cliente debe requerir solamente `clients.view`; las secciones y acciones de vehículos deben mostrarse según sus propios permisos.

### Prioridad media

1. `vehicle_catalog.manage` agrupa crear, editar y desactivar marcas y modelos globales. Es amplio, pero aceptable mientras esas tareas correspondan al mismo perfil operativo. Si se necesita control más fino, debe dividirse mediante una migración futura.
2. `catalog.manage` agrupa productos, servicios y unidades, además de creación, edición y desactivación. También es un permiso amplio aceptado temporalmente.
3. `suppliers.manage` agrupa alta, edición, activación y desactivación. Es coherente con la pantalla actual, aunque no permite separar responsabilidades.
4. `inventory.move` agrupa entradas y salidas; `inventory.adjust` ya protege los ajustes sensibles.

### Catálogo obsoleto o ambiguo

- `expenses.confirm` permanece por compatibilidad, aunque los gastos nuevos se guardan directamente como confirmados. No debe ofrecerse como capacidad necesaria para el flujo normal.
- La descripción de `expenses.create` todavía habla de borradores.
- La descripción de `purchases.create` todavía incluye editar borradores, aunque ya existe `purchases.edit`.
- `orders.manage_payment` es una capacidad separada válida; por decisión del producto, `orders.edit` también permite cambiar el estatus de pago.

Las descripciones deben corregirse en una migración nueva, sin modificar migraciones publicadas.

## Permisos faltantes

No es necesario agregar un permiso nuevo para corregir la paridad entre `admin` y `user`.

En particular, no se propone `orders.manage_costs` por ahora: la regla vigente del producto permite que quien crea o edita una orden capture su costo manual. Si después se desea ocultar esa captura a recepción, deberá agregarse un permiso específico y aplicarse por igual a todos los roles tenant.

Los permisos amplios señalados pueden dividirse cuando exista una necesidad comercial concreta; hacerlo ahora agregaría complejidad de migración y administración sin resolver el defecto principal.

## Orden recomendado de corrección

1. Unificar la navegación tenant mediante una sola definición basada en plan y permisos.
2. Corregir la captura y visualización de costos manuales según `orders.create` o `orders.edit` en su contexto.
3. Relajar la ruta de detalle del cliente y proteger internamente las secciones de vehículos.
4. Centralizar las capacidades de rutas, menú y botones para evitar que cada pantalla reinterprete los permisos.
5. Corregir las descripciones obsoletas del catálogo de permisos.
6. Agregar pruebas de paridad: un `admin` y un `user` con el mismo conjunto operativo deben recibir el mismo resultado de API y la misma interfaz, salvo administración de usuarios y configuración sensible.

## Criterios de aceptación para los siguientes bloques

- `admin` y `user` con permisos operativos idénticos pueden ejecutar las mismas operaciones.
- Ningún botón visible termina en `403` por una condición de rol oculta.
- Ninguna operación permitida por la API queda inaccesible solamente porque el menú la oculta.
- Retirar un permiso oculta la acción y hace que la API la rechace.
- Cambiar la plantilla no agrega privilegios fuera de los permisos guardados.
- La jerarquía de usuarios sigue impidiendo que un `admin` administre a otro administrador.
- `company_admin` conserva acceso automático y la protección del último administrador principal.
- El plan continúa limitando módulos aunque el permiso permanezca asignado.

## Impacto de este bloque

Esta auditoría solamente documenta la política y los hallazgos. No cambia permisos, usuarios, migraciones ni datos. Las correcciones deben implementarse en bloques posteriores con pruebas de API y frontend.

## Normalización aplicada en la API

Actualización del 13 de octubre de 2026:

- Las operaciones que admiten permisos alternativos declaran esa condición en `PermissionGuard` y validan después la acción exacta: edición o desactivación de clientes y vehículos, movimientos o ajustes de inventario, confirmación o cancelación de compras y gastos, y edición o cobro de órdenes.
- `orders.edit` permite capturar y consultar costos manuales durante la edición sin exigir también `orders.create`.
- Los costos de catálogo, FIFO, lotes y totales de utilidad continúan protegidos por `catalog.view_costs` o `profitability.view`, según corresponda.
- El tablero reconoce `orders.edit` y `orders.manage_payment` como capacidades equivalentes para cobros, de acuerdo con la regla vigente del producto.
- No se agregaron permisos nuevos ni se dividieron los permisos amplios actuales. La división no es necesaria para corregir la paridad y se pospone hasta que exista una responsabilidad operativa concreta que deba separarse.
- Las únicas condiciones directas de rol conservadas dentro de módulos tenant corresponden a la configuración fiscal sensible del emisor. La administración de usuarios y permisos conserva su jerarquía fuera de los módulos operativos.

Esta normalización no requiere una migración de base de datos.

## Normalización aplicada en el frontend

Actualización del 13 de octubre de 2026:

- La navegación tenant utiliza una sola definición para `company_admin`, `admin` y `user`, filtrada por plan y permisos. Ya no existen dos menús operativos que puedan desviarse entre roles.
- **Marcas y modelos** aparece para cualquier usuario tenant con `vehicle_catalog.view`; sus acciones de escritura continúan protegidas por `vehicle_catalog.manage`.
- **Usuarios** conserva la restricción de jerarquía para `company_admin` y `admin`.
- El detalle del cliente requiere solamente `clients.view`. La consulta y edición de vehículos se muestran y se cargan mediante sus permisos correspondientes.
- La captura de costo manual usa `orders.create` al crear y `orders.edit` al editar. La consulta de costos de catálogo y FIFO conserva `catalog.view_costs`.
- Las acciones rápidas del tablero se calculan mediante las mismas dependencias de plan y permisos que sus rutas.
- Los errores `403` por permisos se presentan como una explicación accionable y no como el mensaje genérico **Permisos insuficientes**.
- Las condiciones visuales restantes basadas en rol corresponden a plataforma, descripción de la cuenta o administración jerárquica de usuarios.

Esta normalización tampoco requiere una migración de base de datos.

## Compatibilidad y validación integral

Actualización del 13 de octubre de 2026:

- La base local se auditó en modo de solo lectura: no existen usuarios tenant `admin` o `user` sin perfil de permisos, perfiles no personalizados distintos de su plantilla ni asignaciones incompatibles con el rol.
- Los permisos personalizados existentes se conservaron sin modificaciones. Los Administradores principales continúan recibiendo el catálogo completo de forma automática y no necesitan filas en `user_permissions`.
- La base local tiene 40 permisos operativos aplicados. Los seis permisos adicionales de facturación simulada pertenecen a la migración ya existente `SimulatedInvoicingSettings1700000042000`, que todavía está pendiente en ese entorno. Esta normalización no agrega permisos ni modifica plantillas, por lo que no se creó otra migración.
- La integración crea un `admin` y un `user` con una matriz idéntica y comprueba el mismo resultado al crear clientes, marcas, modelos, vehículos y órdenes; editar órdenes y costos manuales; cambiar el estado de pago; agregar seguimiento; y consultar el tablero.
- La misma prueba accede directamente a endpoints no concedidos y exige `403`: desactivar clientes requiere `clients.deactivate`, y cancelar órdenes requiere `orders.cancel` además del permiso general para cambiar estatus.
- Las pruebas existentes continúan cubriendo permisos parciales, intersección con el plan, costos ocultos, escalamiento, aislamiento entre compañías, conservación de permisos personalizados después de cambiar el plan y preservación del historial operativo al cambiar rol, permisos o estatus del usuario.
- Las rutas operativas del frontend usan plan y permiso. El acceso directo a una URL restringida se redirige a **Acceso insuficiente**, mientras la API vuelve a proteger la operación de manera independiente.

Resultados de validación:

- API: compilación y lint correctos.
- Frontend: compilación de producción correcta.
- Pruebas unitarias: 36 suites, 124 pruebas aprobadas.
- Pruebas de integración con PostgreSQL real: 4 suites, 49 pruebas aprobadas.
