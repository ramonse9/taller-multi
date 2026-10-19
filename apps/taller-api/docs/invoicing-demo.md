# Demostración integrada de operación y facturación simulada

Esta demostración es exclusivamente local. Crea la compañía aislada `demo_facturacion` con datos ficticios, plan `invoicing`, un usuario operativo y un usuario con la plantilla `Contabilidad`.

## Seguridad y carga

1. Copiar `apps/taller-api/.env.demo.example` como `apps/taller-api/.env.demo.local`.
2. Asignar dos contraseñas de 6 a 10 caracteres, con al menos una letra y un número.
3. Mantener PostgreSQL local disponible y la URL local en `apps/taller-api/.env`.
4. Previsualizar desde la raíz:

   ```bash
   npm run demo:invoicing:preview
   ```

5. Cargar el escenario:

   ```bash
   npm run demo:invoicing:load
   ```

6. Validarlo:

   ```bash
   npm run demo:invoicing:validate
   ```

El cargador rechaza bases remotas y `NODE_ENV=production`, utiliza una transacción `SERIALIZABLE`, toma un bloqueo exclusivo y no modifica otros schemas tenant. Si se ejecuta nuevamente, valida que la carga esté completa y no crea duplicados.

Las credenciales quedan en `.local-backups/invoicing-demo-credentials.txt`, con permisos locales `0600`. Tanto ese archivo como `.env.demo.local` están ignorados por Git.

## Escenario incluido

- Emisor ficticio identificado como demostrativo y configurado solamente en modo `simulation`.
- Dos clientes con perfil fiscal completo y uno incompleto.
- Una orden en proceso.
- Órdenes terminadas pagadas y pendientes.
- Órdenes sin factura.
- Un borrador PUE pendiente para demostrar el bloqueo de emisión.
- Una simulación PUE emitida y pagada.
- Una simulación PPD emitida y pendiente.
- Una simulación PPD cancelada.
- Gastos confirmados de renta y servicios.
- Conceptos libres con servicios cobrables e insumos no cobrables.

## Video 1 · Operación en tableta

Resolución sugerida: `1024 × 768`, tema claro.

1. Iniciar sesión con `operador@demo_facturacion`.
2. Mostrar Inicio y sus accesos operativos.
3. Abrir `Nueva orden`.
4. Crear un cliente ficticio y su vehículo desde el asistente.
5. Capturar un servicio cobrable y un producto como insumo incluido.
6. Guardar, terminar la orden y marcarla como pagada.
7. Registrar un gasto.
8. Abrir Tablero y después Utilidad.
9. Destacar ingresos, costos, gastos y utilidad sin entrar a Facturación.

## Video 2 · Operación en móvil

Resolución sugerida: `390 × 844`, tema oscuro.

1. Iniciar sesión con el usuario operativo.
2. Recorrer Inicio, Órdenes y Clientes usando tarjetas y navegación móvil.
3. Abrir el detalle de una orden ya terminada.
4. Mostrar por separado `OPERACIÓN`, `COBRO` y `FACTURACIÓN`.
5. Registrar un gasto rápido.
6. Confirmar que tarjetas, formularios y acciones no producen desplazamiento horizontal.

## Video 3 · Contabilidad en tableta

Resolución sugerida: `1024 × 768`, tema claro.

1. Iniciar sesión con `contabilidad@demo_facturacion`.
2. Mostrar Inicio limitado a Órdenes, Clientes y Facturación.
3. Abrir `DEMO-FISC-001` y mostrar que el cliente no está listo para facturar.
4. Entrar al cliente y completar solamente su bloque fiscal.
5. Abrir `DEMO-FISC-002` y seleccionar `Preparar factura simulada`.
6. Revisar receptor, Uso CFDI, PUE y forma de pago.
7. Crear el borrador y emitir la simulación.
8. Mostrar conceptos, subtotal, IVA y total.
9. Abrir la representación imprimible y enfocar la leyenda `SIMULACIÓN SIN VALIDEZ FISCAL`.

## Video 4 · Contabilidad en móvil

Resolución sugerida: `390 × 844`, tema oscuro.

1. Iniciar sesión con Contabilidad.
2. Mostrar que no aparecen Nueva orden, Gastos, Inventario ni Utilidad.
3. Abrir el filtro `Pendientes de facturar`.
4. Mostrar el borrador PUE de `DEMO-FISC-003` y su bloqueo por cobro pendiente.
5. Abrir la simulación PPD de `DEMO-FISC-005` y mostrar que la orden continúa pendiente.
6. Abrir la simulación cancelada de `DEMO-FISC-006` y su historial.
7. Intentar directamente `/orders/new`, `/expenses` y `/inventory` para mostrar acceso insuficiente.
8. Confirmar que el aviso de simulación permanece visible.

## Lista de comprobación visual

- Revisar a `320 px`, `390 px` y `1024 px`.
- Probar los cuatro recorridos en claro y oscuro.
- Confirmar navegación por teclado, foco visible y textos completos.
- Revisar que no exista desplazamiento horizontal involuntario.
- Verificar que la consola del navegador no muestre errores.
- Confirmar que operación, cobro y facturación nunca cambien automáticamente entre sí.
- Confirmar que una factura activa bloquee reapertura o cancelación de la orden.
- Confirmar que Contabilidad no pueda crear órdenes, vehículos, marcas ni modelos, ni entrando por URL.

## Límites fiscales de esta fase

Todo documento generado es una simulación interna sin validez fiscal. Todavía requieren implementación y contratación:

- Elección e integración de un PAC.
- Carga y protección de certificados CSD y llave privada.
- Generación, sellado y validación del XML CFDI 4.0.
- Timbrado real y recepción del UUID fiscal.
- Cancelación ante el SAT.
- Complementos de pago.
- Representación impresa derivada de un XML timbrado real.

Nunca debe presentarse una simulación como CFDI emitido o timbrado.
