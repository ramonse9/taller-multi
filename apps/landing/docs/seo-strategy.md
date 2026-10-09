# Estrategia SEO y arquitectura de contenido

**Marca:** Multiservicios 24/7  
**Dominio comercial:** <https://www.multiservicios247.com/>  
**Aplicación:** <https://app.multiservicios247.com/>  
**Contacto principal:** WhatsApp [+52 667 578 7701](https://wa.me/526675787701)  
**Mercado inicial:** propietarios y administradores de talleres automotrices en México  
**Fecha de investigación:** 9 de octubre de 2026

## 1. Resumen ejecutivo

La página de inicio debe posicionar a Multiservicios 24/7 como un **software para talleres mecánicos** que permite empezar con lo esencial —clientes, vehículos y órdenes— y añadir control de catálogo, inventario, compras, gastos y utilidad cuando el taller lo necesite.

La promesa principal no debe ser “hacer de todo” ni competir todavía por facturación. La oportunidad más creíble y diferenciadora es:

> Registrar el trabajo del taller sin complicarlo y convertir órdenes, insumos, costos y gastos en una visión clara de la utilidad.

La utilidad debe comunicarse con precisión: el sistema calcula ingresos, costos directos, gastos y resultado operativo con la información capturada; utiliza FIFO para productos de inventario y advierte cuando falta el costo de un producto libre. No se debe prometer una “utilidad real” o “exacta” sin esa condición.

La conversión principal será una conversación humana por WhatsApp. La landing no necesita un formulario largo en la primera versión. El objetivo es que un prospecto entienda el valor, vea el producto y solicite una demostración.

## 2. Método y límites de la investigación

La estrategia se construyó con tres fuentes:

1. Auditoría de la [landing pública actual](https://www.multiservicios247.com/).
2. Revisión del código de `taller-web` y `taller-api`, incluyendo rutas, suscripciones, órdenes, inventario y reportes de utilidad.
3. Revisión cualitativa de resultados de búsqueda y páginas que compiten actualmente en México por consultas relacionadas con software para talleres.

La investigación de palabras clave es **cualitativa**. La aparición de una consulta o competidor en resultados no equivale a volumen de búsqueda. Los volúmenes, dificultad y costo por clic deberán validarse más adelante con Google Ads Keyword Planner y, después de publicar, con datos reales de Google Search Console.

## 3. Auditoría de la landing actual

### 3.1 Lo que conviene conservar

- El dominio y la marca ya explican que se trata de software para talleres.
- Existe un enlace visible hacia la aplicación.
- La página utiliza vocabulario que el mercado reconoce: clientes, vehículos, órdenes e inventario.
- La ubicación en México ayuda a contextualizar el producto.
- El sitio ya intenta responder a búsquedas como “software para taller mecánico”.

### 3.2 Problemas de contenido y conversión

- El mensaje principal enumera demasiadas capacidades y no establece una razón clara para elegir el producto.
- La propuesta depende de facturación electrónica, aunque esa funcionalidad no está disponible en la versión actual.
- El formulario exige nombre, correo, teléfono, taller, mensaje y aceptación antes de iniciar una conversación. Esto agrega fricción frente a WhatsApp.
- Los datos del panel demostrativo se presentan sin una indicación suficientemente clara de que son ficticios.
- La navegación repite beneficios y funcionalidades sin una progresión narrativa.
- La frase visible “Palabras clave para SEO” es keyword stuffing y debe eliminarse. Las palabras clave deben aparecer de manera natural dentro del contenido útil.
- El teléfono público actual debe reemplazarse por `+52 667 578 7701`.
- El acceso a la plataforma debe conservarse, pero como acción secundaria para usuarios existentes.

### 3.3 Afirmaciones que deben eliminarse o comprobarse

| Afirmación actual | Decisión recomendada | Motivo |
| --- | --- | --- |
| Facturación electrónica CFDI 4.0 y conexión con SAT | Eliminar de capacidades disponibles | El plan existe en el modelo, pero la facturación se dejó para una fase posterior. |
| Firma digital del cliente | Eliminar | No está implementada en la aplicación revisada. |
| Foto evidencia del vehículo | Eliminar | No está implementada en la aplicación revisada. |
| Recordatorios de mantenimiento | Eliminar | No se encontró esta funcionalidad. |
| Más de 250 talleres | Eliminar hasta contar con evidencia | No existe una fuente verificable proporcionada. |
| Aumento de productividad de 40% | Eliminar hasta contar con estudio verificable | Es una promesa cuantitativa sin respaldo disponible. |
| Reducción administrativa de 60% | Eliminar junto con el testimonio no comprobado | Requiere cliente real, autorización y metodología. |
| Testimonios y nombres publicados | Retirar hasta validarlos | No se debe presentar prueba social inventada. |
| Implementación en 48 horas | Confirmar o retirar | Implica un compromiso operativo concreto. |
| Capacitación incluida y sin costo | Confirmar condiciones antes de publicar | Puede generar una obligación comercial no definida. |
| Soporte técnico 24/7 | Retirar salvo que exista cobertura real | “24/7” implica disponibilidad continua. |
| Respuesta en menos de 24 horas | Confirmar o reemplazar por una frase no contractual | Debe corresponder con la capacidad real de atención. |
| Demo gratis | Usar “Solicitar demostración” | Agregar “gratis” solamente si la política comercial está confirmada. |
| Actualizaciones sin costo adicional | Confirmar condiciones | Depende del modelo comercial y suscripción. |

## 4. Capacidades reales que sí pueden comunicarse

### 4.1 Núcleo operativo

- Registro y búsqueda de clientes, tanto personas como empresas.
- Vehículos asociados a cada cliente e historial por cliente y vehículo.
- Creación rápida de clientes y vehículos durante el registro de una orden.
- Órdenes de servicio con folio del sistema y folio externo opcional.
- Estados En proceso, Terminada y Cancelada, con historial de cambios.
- Seguimiento mediante notas internas independientes del estado.
- Distinción entre servicios o conceptos cobrables e insumos utilizados.
- Precio de venta separado del costo.
- Identificación de órdenes pagadas y pendientes de cobro.

### 4.2 Operación flexible para talleres pequeños

- Captura libre de conceptos sin obligar al taller a construir primero un catálogo.
- Servicios con costo opcional.
- Productos libres y productos cobrados directamente.
- Posibilidad de comenzar con clientes, vehículos, órdenes e historial.
- Folio externo para convivir temporalmente con controles en Excel.
- Acceso mediante usuario de la forma `usuario@compania`, sin exigir correo electrónico.

### 4.3 Control e inventario

- Catálogo de productos y servicios.
- Unidades, SKU, costo, precio y existencia mínima.
- Proveedores y compras.
- Entradas, salidas y ajustes de inventario.
- Lotes de inventario con costo de adquisición.
- Último costo y costo promedio.
- Consumo FIFO al terminar órdenes y devolución al reabrir o cancelar.
- Alertas de existencia baja.

### 4.4 Gastos y utilidad

- Registro y clasificación de gastos.
- Ingresos generados y cobrados.
- Pendientes por cobrar.
- Costo directo de productos y servicios.
- Utilidad bruta y utilidad operativa.
- Resultado generado frente a resultado cobrado.
- Resúmenes mensuales, comparativos y gráficas.
- Identificación de órdenes con información de costos incompleta.

### 4.5 Administración y seguridad

- Planes Básico y Control con capacidades diferenciadas.
- Roles Administrador principal, Administrador y Usuario.
- Permisos configurables por módulo y acción.
- Plantillas de permisos para diferentes funciones del taller.
- Sesiones seguras y restablecimiento administrativo de contraseña.
- Separación de información entre compañías.

### 4.6 Capacidades que no deben anunciarse todavía

- Facturación CFDI o integración con el SAT.
- Complementos de pago.
- Cotizaciones digitales como flujo independiente.
- Agenda o citas.
- Asignación de técnicos, comisiones o control de horas.
- Portal o seguimiento para clientes.
- Notificaciones automáticas por WhatsApp, SMS o correo.
- Fotografías, evidencia o firma digital.
- Aplicación móvil nativa.
- Control de múltiples sucursales como módulo operativo; existen límites de suscripción, pero no se revisó un módulo de sucursales disponible para el usuario.

## 5. Mercado, necesidades y objeciones

### 5.1 Taller pequeño o en proceso de digitalización

**Situación habitual:** utiliza libreta, Excel y mensajes para recordar trabajos, clientes y vehículos.

**Necesidades:**

- Registrar rápido sin llenar catálogos extensos.
- Encontrar qué se hizo anteriormente a un vehículo.
- Conservar un folio que ya utiliza fuera del sistema.
- Saber qué está en proceso y qué falta cobrar.
- Usar el sistema desde teléfono o computadora.

**Objeciones:**

- “Capturar todo me quitará más tiempo que la libreta”.
- “No quiero controlar inventario todavía”.
- “Mis empleados no tienen correo”.
- “Ya llevo mis folios en Excel”.
- “No quiero aprender un sistema complicado”.

**Respuesta del producto:** puede comenzar con el plan Básico, conceptos libres, creación rápida dentro de la orden y folio externo. No necesita inventario para obtener historial operativo.

### 5.2 Taller con compras, almacén o mayor volumen

**Situación habitual:** compra el mismo producto a costos diferentes, consume insumos en servicios y quiere entender sus márgenes.

**Necesidades:**

- Existencias y alertas de inventario.
- Registro de compras y proveedores.
- Costo real del producto utilizado.
- Separar productos cobrados de insumos incluidos en un servicio.
- Controlar quién puede ver costos, hacer ajustes o cancelar movimientos.

**Objeciones:**

- “El costo de mis refacciones cambia en cada compra”.
- “No todos mis empleados deben ver la utilidad”.
- “No quiero perder información si cambio de plan”.
- “Una orden puede incluir varios servicios e insumos”.

**Respuesta del producto:** lotes por entrada, consumo FIFO, costos históricos, conceptos cobrables e insumos, y permisos por usuario.

### 5.3 Propietario enfocado en rentabilidad

**Situación habitual:** conoce cuánto factura o cobra, pero no necesariamente cuánto queda después de costos y gastos.

**Necesidades:**

- Diferenciar generado, cobrado y pendiente.
- Restar costos directos y gastos operativos.
- Comparar meses.
- Detectar órdenes incompletas antes de confiar en el resultado.

**Respuesta del producto:** tablero y reporte de utilidad con ingresos, costos FIFO, gastos, utilidad bruta, utilidad operativa y advertencias de información incompleta.

## 6. Investigación cualitativa de búsquedas

### 6.1 Observaciones de resultados actuales

La consulta amplia está dominada por páginas que utilizan de forma directa “software para taller mecánico” o “software para talleres mecánicos en México”. Las páginas que aparecen también desarrollan clústeres específicos sobre órdenes, inventario y utilidad:

- [Protaller](https://www.protaller.mx/) orienta su página principal a “software para taller mecánico en México”.
- [TallERP](https://www.tallerp.com/ordenes-de-servicio) utiliza una página específica para “software de órdenes de servicio para talleres mecánicos”.
- [Tallerfy](https://www.tallerfy.io/mx/software-de-ordenes-de-servicio-para-talleres-mecanicos/) trabaja una variante mexicana de órdenes de servicio y comunica utilidad por vehículo.
- [AutoSoft Taller](https://autosofttaller.com/) dedica una sección extensa a costos y análisis de ganancias.
- [KIPUP](https://kipup.com.mx/) agrupa administración, órdenes, inventario, clientes, compras y reportes bajo una página dirigida a México.

La oportunidad no está en repetir todas las funciones de esos competidores, sino en ocupar una posición específica: **una adopción gradual y sencilla que puede llegar hasta el control de utilidad sin obligar a un taller pequeño a implementar inventario desde el primer día**.

### 6.2 Clúster principal para la página de inicio

| Prioridad | Consulta o variante | Intención | Uso recomendado |
| --- | --- | --- | --- |
| Primaria | software para talleres mecánicos | Comercial | Title, introducción, contenido principal y texto de enlaces externos. |
| Primaria | software para taller mecánico | Comercial | H1 o primer párrafo; utilizar singular y plural de forma natural. |
| Primaria | sistema para taller mecánico | Comercial | Secciones de solución y preguntas frecuentes. |
| Secundaria | programa para taller mecánico | Comercial | Comparaciones y preguntas frecuentes, sin forzar la repetición. |
| Secundaria | software para talleres mecánicos en México | Comercial/local | Introducción y metadatos secundarios. |
| Secundaria | sistema de administración para taller automotriz | Comercial | Sección que reúne operación y administración. |

### 6.3 Clústeres secundarios

#### Órdenes e historial

- sistema de órdenes de servicio para taller mecánico
- software de órdenes de trabajo para talleres
- control de órdenes de servicio automotriz
- historial de servicios de vehículos
- control de clientes y vehículos para taller

#### Inventario, compras y costos

- inventario para taller mecánico
- control de refacciones para taller
- software de inventario de refacciones
- control de compras y proveedores para taller
- costo de refacciones por lote

#### Utilidad y control financiero operativo

- utilidad de un taller mecánico
- software para calcular utilidad del taller
- control de gastos de taller mecánico
- saber cuánto gana un taller mecánico
- ingresos costos y gastos de taller

#### Adopción y comparación

- cómo administrar un taller mecánico
- sistema para reemplazar Excel en un taller
- digitalizar órdenes de un taller mecánico
- programa sencillo para taller pequeño
- software para taller mecánico desde celular

Estas variantes deben orientar temas y respuestas. No deben colocarse como una lista de palabras clave dentro de la página.

### 6.4 Intención que debe resolver la página principal

La página de inicio atenderá intención **comercial e investigativa**: la persona sabe que necesita más control y está comparando soluciones, pero todavía debe confirmar que el producto se adapta a su forma de trabajar.

La respuesta debe cubrir, en este orden:

1. Qué problema resuelve.
2. Qué tan difícil será comenzar.
3. Cómo funciona una orden dentro del sistema.
4. Cómo ayuda a conocer costos y utilidad.
5. Qué incluye cada nivel de control.
6. Cómo puede ver una demostración y resolver dudas.

## 7. Posicionamiento y propuesta de valor

### 7.1 Posicionamiento recomendado

> Multiservicios 24/7 es un software para talleres mecánicos que organiza clientes, vehículos y órdenes desde el primer día, y permite añadir inventario, compras, gastos y cálculo de utilidad cuando el taller necesita mayor control.

### 7.2 Promesa principal

> Controla el trabajo que entra, los insumos que utilizas y el dinero que realmente puedes analizar con la información capturada.

### 7.3 Diferenciadores demostrables

1. **Comenzar sin llenar catálogos:** los conceptos libres permiten registrar servicios desde la primera orden.
2. **Creación dentro del flujo:** clientes y vehículos pueden darse de alta mientras se registra el servicio.
3. **Servicios e insumos separados:** un producto puede utilizarse como insumo incluido o cobrarse directamente.
4. **Costos de compra históricos:** inventario por lotes y consumo FIFO para reflejar costos variables.
5. **Utilidad transparente:** distingue generado, cobrado y pendiente, y advierte cuando faltan datos.
6. **Adopción gradual:** el taller puede comenzar con historial y órdenes y avanzar hacia inventario y rentabilidad.
7. **Permisos configurables:** costos, utilidad, ajustes y acciones sensibles pueden limitarse por usuario.

### 7.4 Tono de comunicación

- Español mexicano claro y directo.
- Hablar de “tú” al propietario del taller.
- Evitar lenguaje corporativo como “transformación integral” o “sinergia”.
- Preferir ejemplos concretos: “bujías”, “aceite”, “filtro”, “mano de obra”, “pendiente por cobrar”.
- No presentar al usuario como desorganizado; reconocer que su operación ya funciona y que el sistema debe adaptarse sin estorbar.
- No atacar Excel, la libreta o WhatsApp. Presentarlos como herramientas que dejan de ser suficientes cuando el taller crece.

## 8. Metadatos y encabezados propuestos

### 8.1 Página de inicio

**Title recomendado**

```text
Software para talleres mecánicos | Multiservicios 24/7
```

**Meta description recomendada**

```text
Administra clientes, vehículos, órdenes, inventario, compras y gastos. Conoce la utilidad de tu taller. Solicita una demostración por WhatsApp.
```

**Eyebrow del hero**

```text
SOFTWARE PARA TALLERES MECÁNICOS EN MÉXICO
```

**H1 recomendado**

```text
Controla cada orden y conoce la utilidad de tu taller
```

**Texto introductorio**

```text
Registra clientes y vehículos, crea órdenes con servicios e insumos y, cuando lo necesites, controla inventario, compras, gastos y utilidad desde un solo lugar.
```

**CTA principal**

```text
Solicitar demostración por WhatsApp
```

**CTA secundario**

```text
Ver cómo funciona
```

**Enlace para usuarios existentes**

```text
Entrar a la plataforma
```

### 8.2 Encabezados de secciones

La jerarquía inicial propuesta es:

- H1: Controla cada orden y conoce la utilidad de tu taller
  - H2: Tu taller ya funciona. El sistema debe ayudarte, no estorbarte
  - H2: Del vehículo que recibes al resultado del mes
    - H3: Cliente y vehículo
    - H3: Orden y trabajo realizado
    - H3: Insumos y costos
    - H3: Cobro y utilidad
  - H2: Comienza con lo esencial
  - H2: Agrega control cuando tu operación lo necesite
  - H2: Entiende de dónde sale tu utilidad
  - H2: Cada persona ve y hace solamente lo que le corresponde
  - H2: Elige el nivel de control adecuado para tu taller
  - H2: Preguntas antes de cambiar tu forma de trabajar
  - H2: Conoce el sistema con una demostración para tu taller

## 9. Arquitectura narrativa de la landing

### 9.1 Encabezado

**Objetivo:** orientar sin distraer.

Elementos:

- Marca Multiservicios 24/7.
- Enlaces ancla: Cómo funciona, Control, Planes y Preguntas.
- Enlace secundario “Entrar”.
- CTA “Solicitar demostración”.

### 9.2 Hero

**Objetivo:** responder en segundos qué es, para quién es y qué resultado ofrece.

**Contenido:**

- Eyebrow con la categoría.
- H1 centrado en orden y utilidad.
- Párrafo con clientes, vehículos, órdenes y crecimiento hacia Control.
- CTA principal hacia WhatsApp.
- CTA secundario hacia el flujo del producto.
- Vista real o recreación fiel del tablero, marcada como demostración si utiliza datos ficticios.

### 9.3 Reconocimiento del problema

**H2:** Tu taller ya funciona. El sistema debe ayudarte, no estorbarte

**Texto propuesto:**

> Una libreta, Excel y WhatsApp pueden resolver el día cuando el taller comienza. El problema aparece cuando necesitas encontrar el historial de un vehículo, recordar qué falta cobrar o saber cuánto dejaron realmente los trabajos del mes. Multiservicios 24/7 reúne esa información sin obligarte a controlar todo desde el primer día.

No utilizar porcentajes de pérdidas ni productividad sin evidencia.

### 9.4 Flujo del producto

**H2:** Del vehículo que recibes al resultado del mes

Narrar cuatro pasos con capturas o una demostración visual:

1. Seleccionar o crear cliente y vehículo.
2. Registrar servicios cobrables e insumos utilizados.
3. Terminar la orden y aplicar el consumo de inventario cuando corresponda.
4. Marcar el cobro y consultar ingresos, costos, gastos y utilidad.

Este bloque es más valioso que una cuadrícula genérica de funcionalidades porque enseña la lógica del producto.

### 9.5 Entrada sencilla

**H2:** Comienza con lo esencial

**Copy propuesto:**

> Si hoy quieres conservar el historial de tus clientes, vehículos y servicios, puedes capturar conceptos libremente y trabajar sin un catálogo de productos. Incluso puedes conservar el folio que ya utilizas en Excel mientras adoptas el sistema.

Elementos visuales:

- Cliente y vehículo.
- Orden con folio interno y externo.
- Servicios y conceptos libres.
- Estados e historial.
- Pagada o pendiente.

### 9.6 Control operativo

**H2:** Agrega control cuando tu operación lo necesite

**Copy propuesto:**

> Cuando quieras controlar compras e inventario, cada entrada puede conservar su costo. Al terminar una orden, los productos utilizados consumen los lotes más antiguos y el sistema mantiene el costo histórico del trabajo.

Incluir:

- Catálogo de productos y servicios.
- Proveedores y compras.
- Existencias y mínimos.
- Lotes y FIFO.
- Gastos.

### 9.7 Utilidad

**H2:** Entiende de dónde sale tu utilidad

**Copy propuesto:**

> Compara lo generado con lo cobrado, resta el costo de los productos y servicios utilizados y agrega los gastos del periodo. Si falta el costo de un producto, el sistema lo señala para que no confundas una estimación con un resultado completo.

Mostrar, sin inventar resultados:

- Ingresos generados.
- Ingresos cobrados.
- Pendiente por cobrar.
- Costo directo.
- Gastos operativos.
- Utilidad operativa.

Si se utilizan cantidades de demostración, deben incluir la etiqueta visible “Datos de demostración”.

### 9.8 Usuarios y permisos

**H2:** Cada persona ve y hace solamente lo que le corresponde

Explicar de forma breve:

- Administrador principal, Administrador y Usuario.
- Plantillas por función.
- Restricción de costos, utilidad, ajustes y cancelaciones.
- Inicio de sesión sin exigir correo a cada empleado.

### 9.9 Planes

**H2:** Elige el nivel de control adecuado para tu taller

Por ahora deben mostrarse sin precios hasta que la estrategia comercial esté definida:

- **Básico:** clientes, vehículos, órdenes, historial y conceptos libres.
- **Control:** todo lo anterior más catálogo, inventario, compras, proveedores, gastos y utilidad.
- **Facturación:** no presentarlo como disponible. Puede omitirse o mostrarse únicamente como “Próximamente”, sin características fiscales prometidas.

### 9.10 Preguntas frecuentes

Preguntas iniciales:

1. ¿Tengo que cargar todos mis productos antes de comenzar?
2. ¿Puedo seguir usando el folio que llevo en Excel?
3. ¿Funciona para un taller pequeño?
4. ¿Puedo usarlo desde mi celular?
5. ¿Cómo calcula el costo de las refacciones?
6. ¿Puedo decidir quién ve los costos y la utilidad?
7. ¿Qué sucede si todavía no quiero controlar inventario?
8. ¿La facturación electrónica ya está disponible?

La respuesta a la última pregunta debe ser directa: no está disponible actualmente y se contempla para una fase posterior.

### 9.11 Cierre

**H2:** Conoce el sistema con una demostración para tu taller

**Texto propuesto:**

> Cuéntanos cómo registras hoy tus órdenes y qué te gustaría controlar. Te mostramos el flujo que mejor se adapte al tamaño y forma de trabajo de tu taller.

**CTA:** Solicitar demostración por WhatsApp

## 10. Estrategia de conversión por WhatsApp

### 10.1 Enlace orgánico principal

```text
https://wa.me/526675787701?text=Hola%2C%20vi%20Multiservicios%2024%2F7%20y%20quiero%20conocer%20el%20sistema%20para%20administrar%20mi%20taller.%20Me%20gustar%C3%ADa%20solicitar%20una%20demostraci%C3%B3n.
```

### 10.2 Mensaje visible antes del clic

El usuario debe saber qué ocurrirá:

```text
Abriremos WhatsApp con un mensaje listo para solicitar tu demostración.
```

### 10.3 Ubicaciones del CTA

- Encabezado.
- Hero.
- Después del bloque de utilidad.
- Cierre de la página.
- Acción fija discreta en móvil, sin cubrir contenido ni competir con otros botones.

WhatsApp debe permanecer disponible también en escritorio, donde puede continuar mediante WhatsApp Web.

### 10.4 Etiquetado para campañas

El clic debe registrarse antes de navegar. Además, el mensaje predeterminado puede identificar el origen:

- Orgánico: “vi Multiservicios 24/7 en Google”.
- Facebook: “vi Multiservicios 24/7 en Facebook”.
- TikTok: “vi Multiservicios 24/7 en TikTok”.

No depender únicamente del texto del mensaje para atribución. Conservar parámetros UTM en la landing y emitir un evento como `generate_lead` o `whatsapp_click` con la ubicación del CTA y la fuente.

## 11. Arquitectura SEO futura

La página raíz debe conservar el clúster general “software para talleres mecánicos”. No crear otra página casi idéntica para esa misma intención.

### 11.1 Páginas comerciales futuras

| URL sugerida | Intención principal | Contenido que debe justificarla |
| --- | --- | --- |
| `/ordenes-de-servicio-para-talleres/` | Encontrar un sistema de órdenes | Flujo completo, estados, conceptos, folios, cobro e historial. |
| `/inventario-para-taller-mecanico/` | Controlar refacciones y existencias | Compras, lotes, FIFO, mínimos, movimientos y devoluciones. |
| `/utilidad-del-taller-mecanico/` | Entender ingresos, costos y gastos | Metodología, generado contra cobrado, costos incompletos y ejemplos. |
| `/historial-de-clientes-y-vehiculos/` | Conservar historial de servicios | Relación cliente–vehículo, búsquedas e historial de órdenes. |
| `/software-para-talleres-de-carroceria/` | Evaluar adaptación a carrocería | Publicar solamente después de documentar casos y flujos reales de ese segmento. |

### 11.2 Contenido educativo futuro

- Cómo crear una orden de servicio para un taller mecánico.
- Cómo calcular la utilidad de una orden de reparación.
- Diferencia entre ingresos, cobros y utilidad en un taller.
- Cómo controlar refacciones compradas a diferentes costos.
- Cuándo conviene pasar de Excel a un sistema para taller.
- Cómo organizar el historial de clientes y vehículos.

Cada artículo debe resolver una pregunta completa, usar ejemplos propios y enlazar de manera contextual a la página comercial adecuada. No producir artículos masivos ni páginas por ciudad que repitan el mismo texto.

## 12. Enlazado interno inicial

En la primera versión de una sola página:

- Navegación por anclas descriptivas.
- Logo enlazado al inicio.
- “Entrar a la plataforma” hacia `https://app.multiservicios247.com/`.
- Enlaces legales reales en el pie.
- WhatsApp como enlace rastreable estándar.

Cuando existan páginas secundarias:

- La portada enlazará a órdenes, inventario, utilidad e historial desde sus secciones correspondientes.
- Las páginas secundarias regresarán a la portada con texto de marca y enlazarán entre sí solamente cuando exista relación temática.
- Los artículos educativos enlazarán a una página comercial y a uno o dos contenidos complementarios.

## 13. Requisitos editoriales y de confianza

- Toda cifra comercial debe indicar su fuente y periodo.
- Todo testimonio debe ser real, autorizado y atribuible.
- Las capturas deben corresponder a la aplicación actual.
- Los datos ficticios dentro de capturas o maquetas deben indicar “Datos de demostración”.
- No publicar precios hasta que estén definidos y puedan mantenerse actualizados.
- No prometer horarios de soporte o implementación sin una política operativa.
- Mostrar un aviso de privacidad real antes de instalar analítica publicitaria que lo requiera.
- Evitar sellos, insignias o logotipos de terceros sin autorización.

## 14. Información pendiente antes del contenido definitivo

1. Razón social o responsable legal del sitio.
2. Correo público definitivo.
3. Domicilio o alcance geográfico que debe publicarse.
4. Horario real de atención por WhatsApp.
5. Política de demostraciones y periodo de prueba.
6. Precios y condiciones, si se mostrarán.
7. Alcance real de capacitación, implementación y soporte.
8. Aviso de privacidad y términos.
9. Identificadores de Google Analytics, Meta Pixel o TikTok Pixel.
10. Capturas aprobadas y datos que deberán anonimizarse.
11. Testimonios reales, cuando existan.
12. Identidad visual definitiva: logotipo, favicon y recursos de marca.

Estos pendientes no bloquean la construcción de la base visual, pero sí deben resolverse antes de publicar afirmaciones comerciales o activar medición publicitaria.

## 15. Criterios de aceptación para el contenido

- Una persona puede identificar en menos de un bloque visual que es software para talleres mecánicos.
- El H1 expresa un resultado, no una lista de módulos.
- La página explica cómo funciona una orden con servicios e insumos.
- La utilidad se comunica sin ocultar el papel de los costos faltantes.
- Básico y Control se distinguen sin inventar precios.
- Facturación no se presenta como disponible.
- No existen estadísticas, clientes o testimonios inventados.
- Todas las CTA principales abren el WhatsApp correcto.
- El acceso a la aplicación es visible pero secundario.
- El contenido es comprensible sin imágenes ni JavaScript.
- No existe una lista visible de “palabras clave SEO”.

## 16. Fuentes consultadas

- [Landing actual de Multiservicios 24/7](https://www.multiservicios247.com/).
- [Google Search Central: guía SEO para desarrolladores](https://developers.google.com/search/docs/fundamentals/get-started-developers).
- [Google Search Central: fundamentos de SEO para JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- [Protaller](https://www.protaller.mx/).
- [TallERP: órdenes de servicio](https://www.tallerp.com/ordenes-de-servicio).
- [Tallerfy México: órdenes de servicio](https://www.tallerfy.io/mx/software-de-ordenes-de-servicio-para-talleres-mecanicos/).
- [AutoSoft Taller](https://autosofttaller.com/).
- [KIPUP](https://kipup.com.mx/).
- Código fuente local de `apps/taller-web` y `apps/taller-api`, revisado el 9 de octubre de 2026.

