# MercadoBugs — Análisis Funcional

**Documento de referencia para pruebas funcionales**

## 1. Introducción

MercadoBugs es un entorno de comercio electrónico ficticio destinado a actividades de aseguramiento
de calidad. Permite recorrer un catálogo, gestionar un carrito, aplicar promociones, completar una
compra simulada y consultar el historial resultante.

Todos los productos, precios, direcciones, pagos, envíos y pedidos utilizados en la aplicación son
ficticios. No debe ingresarse información personal, bancaria o comercial real.

Este documento define el comportamiento funcional esperado. Un resultado observable que no cumpla
estos requisitos debe analizarse como una posible desviación del producto.

## 2. Objetivo

Proporcionar una referencia suficiente para que el equipo QA pueda:

- comprender el alcance de MercadoBugs;
- identificar reglas y restricciones de negocio;
- diseñar pruebas positivas, negativas, de límites y combinatorias;
- comparar el resultado obtenido con el comportamiento esperado;
- mantener trazabilidad entre requisitos y pruebas.

Este documento describe qué debe hacer el sistema. No prescribe su implementación ni contiene casos
de prueba terminados.

## 3. Alcance

La versión evaluada comprende:

- navegación pública por Inicio, catálogo y detalle de producto;
- registro, inicio y cierre de sesión;
- búsqueda, filtros y ordenamiento del catálogo;
- carrito persistente y control de cantidades;
- aplicación y eliminación de cupones;
- checkout con entrega y pago simulados;
- validación de disponibilidad y actualización de stock;
- historial y detalle de pedidos propios;
- separación funcional entre visitantes, testers y administradores.

## 4. Fuera de alcance

No forman parte del producto:

- pagos, transferencias o validaciones bancarias reales;
- captura de número de tarjeta, vencimiento, CVV o credenciales bancarias;
- despacho físico, seguimiento logístico o confirmación real de entrega;
- facturación fiscal;
- devoluciones, reembolsos y cancelación de pedidos desde la aplicación;
- recuperación o cambio de contraseña;
- acceso mediante redes sociales, proveedores externos, enlaces mágicos o teléfono;
- edición de perfil, cambio de email o autogestión de roles;
- mantenimiento del catálogo, cupones o stock por parte de un tester;
- administración de usuarios desde la experiencia estándar de testing.

## 5. Roles y actores

### Visitante

Puede acceder a Inicio, catálogo y detalle de productos. Puede registrarse o iniciar sesión. Si
intenta realizar una acción que requiere identidad, debe autenticarse antes de continuar.

### Tester / usuario

Es el rol asignado a toda cuenta nueva. Además de las funciones públicas, puede gestionar su propio
carrito, aplicar cupones, completar compras simuladas y consultar únicamente sus pedidos.

### Administrador

Es un rol asignado mediante un procedimiento autorizado, nunca durante el registro público. Puede
acceder a áreas internas expresamente habilitadas para su rol. Esas herramientas no forman parte del
flujo comercial estándar descrito en este documento.

## 6. Requisitos generales

**RF-GEN-001 — Navegación principal.** La aplicación debe permitir navegar entre Inicio y Productos.
Cuando exista una sesión activa, también debe ofrecer acceso al carrito, a Mis pedidos y al cierre de
sesión.

**RF-GEN-002 — Inicio.** La página de Inicio debe mostrar las categorías activas y hasta ocho
productos activos con stock disponible, ordenados por nombre, con acceso al catálogo y al detalle.

**RF-GEN-003 — Formato monetario.** Los importes visibles deben expresarse en dólares estadounidenses,
con dos decimales y separadores coherentes en toda la aplicación.

**RF-GEN-004 — Estados visibles.** Las operaciones de carga, éxito, ausencia de datos y error deben
presentar un estado comprensible; la interfaz no debe quedar en blanco ni depender únicamente del
color para comunicar información relevante.

**RF-GEN-005 — Adaptación de pantalla.** Las funciones principales deben poder utilizarse en
escritorio, tablet y móvil sin perder contenido, controles ni relaciones entre etiquetas y valores.

## 7. Autenticación

### 7.1 Registro

**RF-AUTH-001 — Datos de registro.** El registro debe solicitar username, email, contraseña y
confirmación de contraseña. Los cuatro campos son obligatorios.

**RF-AUTH-002 — Formato del username.** El username, después de quitar espacios al inicio y al final,
debe contener entre 3 y 20 caracteres. Solo admite letras mayúsculas o minúsculas, números y guion
bajo (`_`).

**RF-AUTH-003 — Unicidad del username.** Dos cuentas no pueden compartir el mismo username aunque
difieran únicamente en mayúsculas y minúsculas. La escritura elegida por el usuario debe conservarse
para su presentación.

**RF-AUTH-004 — Email de registro.** El email debe ser obligatorio, tener un formato válido y no estar
asociado a otra cuenta. Los espacios externos y las diferencias de mayúsculas no deben crear
identidades distintas para el mismo email.

**RF-AUTH-005 — Contraseña de registro.** La contraseña debe tener al menos 8 caracteres. La
confirmación es obligatoria y debe coincidir exactamente con la contraseña.

**RF-AUTH-006 — Alta de cuenta.** Una alta válida debe crear una sesión utilizable inmediatamente,
sin exigir confirmación de email, y asignar siempre el rol tester.

**RF-AUTH-007 — Protección del rol.** El registro no debe permitir elegir, enviar ni obtener un rol
administrativo. Una cuenta nueva debe seguir siendo tester aunque se alteren datos enviados desde el
navegador.

### 7.2 Inicio y cierre de sesión

**RF-AUTH-008 — Inicio de sesión.** El formulario debe exigir email válido y contraseña. Una
combinación correcta debe iniciar sesión; credenciales incorrectas deben rechazarse sin indicar cuál
de los dos datos es el que existe.

**RF-AUTH-009 — Persistencia de sesión.** Una sesión iniciada debe conservarse después de refrescar la
página. Las decisiones de acceso deben esperar a conocer el estado real de la sesión y del perfil.

**RF-AUTH-010 — Rutas protegidas.** Un visitante que abra carrito, checkout o pedidos debe ser enviado
al login. Después de autenticarse correctamente debe regresar a la ubicación protegida que intentaba
visitar.

**RF-AUTH-011 — Páginas públicas de autenticación.** Un usuario ya autenticado que abra Login o
Registro debe ser redirigido a Inicio.

**RF-AUTH-012 — Cierre de sesión.** Cerrar sesión debe invalidar la sesión actual, retirar los datos
privados de la interfaz y volver a Inicio. Refrescar la página no debe restaurar una sesión cerrada.

## 8. Catálogo

**RF-CAT-001 — Visibilidad pública.** El catálogo puede consultarse sin autenticación y debe mostrar
únicamente productos activos pertenecientes a categorías activas.

**RF-CAT-002 — Información de tarjeta.** Cada tarjeta debe mostrar fotografía, nombre, categoría,
precio, disponibilidad actual y acceso al detalle.

**RF-CAT-003 — Stock en tarjeta.** Un producto con stock debe indicar cuántas unidades están
disponibles. Un producto con stock cero debe identificarse como “Sin stock” y no debe permitir su
agregado normal al carrito.

**RF-CAT-004 — Resultado del catálogo.** La página debe informar la cantidad de productos que cumplen
las condiciones activas y presentar un estado específico cuando el resultado sea vacío.

**RF-CAT-005 — Fotografías.** La fotografía debe conservar su proporción, contar con texto alternativo
descriptivo y no deformarse. Si el archivo no puede cargarse, debe mostrarse un fallback controlado en
lugar del icono roto del navegador.

**RF-CAT-006 — Fallo de consulta.** Si el catálogo o las categorías no pueden cargarse, debe mostrarse
un mensaje comprensible y una opción para reintentar.

## 9. Búsqueda, filtros y ordenamiento

**RF-FIL-001 — Búsqueda por nombre.** La búsqueda debe encontrar coincidencias parciales en el nombre
del producto sin distinguir mayúsculas y minúsculas.

**RF-FIL-002 — Entrada de búsqueda.** Los espacios externos deben ignorarse. Los caracteres que suelen
representar comodines no deben ampliar arbitrariamente el conjunto de resultados.

**RF-FIL-003 — Categoría.** Al elegir una categoría deben mostrarse exclusivamente productos de esa
categoría. La opción “Todas las categorías” debe retirar esta restricción.

**RF-FIL-004 — Precio mínimo.** Cuando se informa un mínimo válido, cada resultado debe cumplir
`precio >= mínimo`.

**RF-FIL-005 — Precio máximo.** Cuando se informa un máximo válido, cada resultado debe cumplir
`precio <= máximo`.

**RF-FIL-006 — Validación del rango.** Los extremos pueden dejarse vacíos. Los valores informados deben
ser numéricos y no negativos; si existen ambos, el mínimo no puede superar al máximo. Un rango
inválido no debe aplicarse.

**RF-FIL-007 — Combinación de condiciones.** Búsqueda, categoría, mínimo y máximo deben combinarse de
forma conjunta. Cada producto resultante debe satisfacer todas las condiciones activas.

**RF-FIL-008 — Opciones de orden.** Deben existir las opciones Predeterminado, Precio de menor a mayor,
Precio de mayor a menor y Nombre A–Z. El orden predeterminado debe ser alfabético ascendente por
nombre.

**RF-FIL-009 — Orden sobre resultados.** El ordenamiento debe aplicarse al conjunto ya filtrado, sin
agregar productos que no cumplan los filtros.

**RF-FIL-010 — Persistencia en navegación.** Los filtros válidos y el orden deben reflejarse en la URL
de la página, conservarse al refrescar y permitir volver a estados anteriores con la navegación del
navegador.

**RF-FIL-011 — Limpiar filtros.** “Limpiar todo” debe retirar búsqueda, categoría, rango y orden
personalizado, y restaurar el catálogo completo con el orden predeterminado.

## 10. Detalle de producto

**RF-PROD-001 — Información completa.** El detalle debe mostrar fotografía, nombre, descripción,
categoría, precio, stock y disponibilidad del producto activo.

**RF-PROD-002 — Coherencia.** Nombre, precio, stock e imagen deben corresponder al mismo producto
mostrado en la tarjeta del catálogo.

**RF-PROD-003 — Navegación contextual.** El usuario debe poder volver al catálogo y abrir desde la
categoría del producto el catálogo filtrado por esa categoría.

**RF-PROD-004 — Acción de compra.** Con stock disponible debe ofrecerse Agregar al carrito. Con stock
cero la acción debe permanecer deshabilitada y mostrar la falta de disponibilidad.

**RF-PROD-005 — Producto no disponible.** Un identificador inválido, inexistente, inactivo o asociado a
una categoría inactiva debe mostrar un estado de producto no encontrado o no disponible y permitir
volver al catálogo.

## 11. Carrito

**RF-CART-001 — Acceso.** El carrito requiere una sesión autenticada. Cada usuario debe tener como
máximo un carrito activo y solo debe poder consultar o modificar el propio.

**RF-CART-002 — Agregado inicial.** Agregar por primera vez un producto activo y disponible debe crear
una línea con cantidad 1.

**RF-CART-003 — Producto repetido.** Si el producto ya existe en el carrito, una nueva acción de
agregado debe incrementar la cantidad de la línea existente; no debe crear una segunda línea para el
mismo producto.

**RF-CART-004 — Visitante que intenta agregar.** Un visitante debe ser enviado al login. Al volver no
se debe agregar el producto sin una nueva confirmación explícita del usuario.

**RF-CART-005 — Cantidad válida.** La cantidad debe ser entera, con mínimo 1, y no debe incrementarse
por encima del stock disponible en ese momento.

**RF-CART-006 — Controles de cantidad.** El usuario debe poder aumentar y disminuir cantidades. La
disminución debe deshabilitarse en 1; retirar la última unidad requiere la acción Eliminar.

**RF-CART-007 — Corrección por cambio de stock.** Si una línea queda por encima del stock debido a un
cambio posterior, el sistema debe impedir nuevos incrementos pero permitir disminuirla o eliminarla.

**RF-CART-008 — Eliminar y vaciar.** El usuario debe poder eliminar una línea y vaciar el carrito
completo. Vaciar debe requerir confirmación y recalcular inmediatamente contador e importes.

**RF-CART-009 — Producto no disponible.** Si un producto deja de formar parte del catálogo, la línea
debe identificarse como no disponible, excluirse de los cálculos comerciales y poder eliminarse.

**RF-CART-010 — Cálculos.** El subtotal de línea debe ser `precio unitario × cantidad`; el subtotal del
carrito debe ser la suma de líneas válidas, y el contador debe representar unidades totales.

**RF-CART-011 — Precio vigente.** Mientras no exista un pedido, el carrito debe utilizar el precio
actual del producto. Los importes deben actualizarse ante cambios válidos de cantidad o catálogo.

**RF-CART-012 — Persistencia.** El carrito debe conservarse al refrescar y después de cerrar sesión y
volver a ingresar con la misma cuenta. Otra cuenta no debe verlo ni reutilizarlo.

**RF-CART-013 — Continuación al checkout.** Solo debe habilitarse cuando todas las líneas representan
productos disponibles y sus cantidades no superan el stock conocido.

## 12. Cupones

**RF-COUP-001 — Aplicación.** Un usuario autenticado debe poder introducir un código en su carrito o
durante el checkout. El código debe evaluarse sin distinguir mayúsculas y minúsculas ni espacios
externos.

**RF-COUP-002 — Condiciones de validez.** Un cupón solo puede aplicarse si existe, está activo, su
vigencia ya comenzó, no expiró, cumple el subtotal mínimo y posee un tipo y valor válidos.

**RF-COUP-003 — Cupón rechazado.** Un código inexistente, inactivo, futuro, expirado o que no alcanza
el mínimo debe rechazarse con una explicación comprensible y no debe modificar el descuento ni el
total.

**RF-COUP-004 — Descuento porcentual.** El descuento debe calcularse sobre el subtotal completo
elegible: `subtotal × porcentaje / 100`, redondeado a dos decimales.

**RF-COUP-005 — Descuento fijo.** El descuento debe ser el valor fijo definido. Si ese valor supera el
subtotal, el descuento efectivo debe limitarse al subtotal.

**RF-COUP-006 — Límite del descuento.** Ningún descuento puede producir un importe comercial negativo.

**RF-COUP-007 — Presentación.** Al aplicar un cupón válido deben mostrarse su código, beneficio e
importe ahorrado, y los resúmenes de carrito y checkout deben coincidir.

**RF-COUP-008 — Persistencia.** El cupón válido debe permanecer asociado al carrito después de
refrescar o iniciar una nueva sesión con la misma cuenta.

**RF-COUP-009 — Reevaluación.** Si cambian productos, cantidades, subtotal o vigencia, el cupón debe
validarse nuevamente. Si deja de ser válido, debe retirarse e informarse al usuario.

**RF-COUP-010 — Eliminación.** El usuario debe poder quitar un cupón; al hacerlo, el descuento debe
volver a cero y los totales deben recalcularse.

## 13. Checkout

**RF-CHK-001 — Precondiciones.** El checkout requiere sesión, carrito activo no vacío, productos
activos, cantidades enteras positivas y stock suficiente. Un carrito vacío debe volver a la página
del carrito.

**RF-CHK-002 — Nombre de entrega.** El nombre completo es obligatorio y, después de quitar espacios
externos, debe contener entre 2 y 100 caracteres.

**RF-CHK-003 — Dirección.** La dirección es obligatoria y debe contener entre 5 y 200 caracteres
después de quitar espacios externos.

**RF-CHK-004 — Ciudad.** La ciudad es obligatoria y debe contener entre 2 y 100 caracteres después de
quitar espacios externos.

**RF-CHK-005 — Código postal.** El código postal es obligatorio y debe contener entre 2 y 20
caracteres después de quitar espacios externos.

**RF-CHK-006 — Envío estándar.** Debe ofrecerse envío estándar con costo de US$ 5,00.

**RF-CHK-007 — Envío express.** Debe ofrecerse envío express con costo de US$ 12,00. Solo uno de los
dos métodos de envío puede estar seleccionado.

**RF-CHK-008 — Pago simulado.** Debe permitirse elegir Tarjeta simulada o Transferencia simulada. Solo
una puede seleccionarse y ninguna debe solicitar datos financieros reales.

**RF-CHK-009 — Autoridad de los importes.** Antes de confirmar, el sistema debe volver a obtener los
precios vigentes, validar el cupón, el método de envío, los productos y el stock. Los valores
manipulados en el navegador no deben decidir el pedido.

**RF-CHK-010 — Fórmula final.** El importe debe cumplir `subtotal - descuento + envío = total`. El
subtotal, descuento, envío y total mostrados antes de confirmar deben coincidir con el pedido creado.

**RF-CHK-011 — Confirmación única.** Una única intención de compra debe producir un solo pedido. Las
confirmaciones repetidas o reintentos accidentales de la misma operación no deben generar pedidos
duplicados.

**RF-CHK-012 — Operación completa.** La creación del pedido, sus líneas históricas, la reducción de
stock y el cierre del carrito deben completarse como una sola operación. Ante un fallo, no debe
quedar ninguna de esas acciones aplicada parcialmente.

**RF-CHK-013 — Compra exitosa.** Una confirmación válida debe crear un pedido con estado Confirmado,
actualizar el stock, cerrar el carrito utilizado y llevar al usuario al detalle del nuevo pedido.

**RF-CHK-014 — Carrito posterior.** Después de una compra exitosa, el carrito anterior no debe volver
a aparecer como activo. Una compra posterior debe comenzar en un carrito activo nuevo y vacío.

## 14. Stock

**RF-STK-001 — Sin reserva en carrito.** Agregar unidades al carrito no reserva inventario. La
disponibilidad puede cambiar antes de confirmar la compra.

**RF-STK-002 — Validación final.** Al confirmar, el sistema debe comparar nuevamente la cantidad de
cada línea con el stock actual.

**RF-STK-003 — Stock insuficiente.** Si alguna cantidad solicitada supera el stock actual, el checkout
debe rechazarse, no debe crear un pedido, no debe cerrar el carrito y no debe descontar stock.

**RF-STK-004 — Actualización segura.** Una compra válida debe restar exactamente las unidades
compradas. El stock nunca puede quedar negativo, incluso ante compras concurrentes.

## 15. Pedidos

**RF-ORD-001 — Acceso al historial.** Mis pedidos requiere autenticación y debe mostrar únicamente
pedidos pertenecientes al usuario actual.

**RF-ORD-002 — Orden y límite.** El historial debe presentar primero los pedidos más recientes y
mostrar como máximo los 50 más recientes.

**RF-ORD-003 — Resumen del pedido.** Cada entrada debe mostrar identificador, fecha, estado, cantidad
total de unidades, método de pago, total y acceso al detalle.

**RF-ORD-004 — Estados.** Los estados reconocidos son Pendiente, Confirmado y Cancelado. Una compra
completada mediante el checkout debe comenzar como Confirmada.

**RF-ORD-005 — Productos históricos.** El detalle debe mostrar para cada línea el nombre conservado,
precio unitario, cantidad y total de línea existentes al confirmar la compra.

**RF-ORD-006 — Resumen financiero.** El detalle debe mostrar subtotal, descuento, código de cupón si
aplica, costo y método de envío, y total histórico.

**RF-ORD-007 — Entrega y pago.** El detalle debe mostrar nombre, dirección, ciudad, código postal,
método de envío y método de pago guardados durante el checkout.

**RF-ORD-008 — Inmutabilidad histórica.** Cambios posteriores en nombre, precio, disponibilidad o
eliminación del producto, así como cambios en cupones, no deben alterar un pedido ya confirmado.

**RF-ORD-009 — Pedido inaccesible.** Un identificador inválido, inexistente o perteneciente a otra
cuenta debe producir el mismo estado de “Pedido no encontrado”, sin revelar si existe para otro
usuario.

**RF-ORD-010 — Solo lectura.** Un tester no puede crear pedidos fuera del checkout ni modificar o
eliminar pedidos y líneas históricas. La aplicación no ofrece cancelación ni edición de entrega.

## 16. Seguridad funcional

**RF-SEC-001 — Aislamiento del carrito.** Cada usuario solo puede consultar y modificar su propio
carrito y sus líneas.

**RF-SEC-002 — Aislamiento de pedidos.** Cada tester solo puede consultar sus propios pedidos y sus
detalles.

**RF-SEC-003 — Visitantes.** Un visitante no puede obtener datos de carritos, cupones aplicados,
checkout ni pedidos.

**RF-SEC-004 — Restricción administrativa.** Un tester autenticado que intente abrir un área reservada
a administradores debe recibir un estado de acceso denegado, no el contenido protegido.

**RF-SEC-005 — Rol confiable.** El rol visible y los permisos deben depender de la cuenta autorizada.
Modificar datos del navegador no debe elevar privilegios.

**RF-SEC-006 — Operaciones comerciales protegidas.** Un tester no debe poder alterar directamente
precios, stock, cupones, totales o propietarios de datos para obtener un resultado diferente del
permitido por las reglas funcionales.

## 17. Manejo de errores

**RF-ERR-001 — Mensaje útil.** Una operación fallida debe informar en lenguaje comprensible qué tipo
de acción no pudo completarse, sin mostrar información técnica sensible.

**RF-ERR-002 — Reintento seguro.** Cuando corresponda, debe ofrecerse reintentar. Repetir una solicitud
fallida no debe duplicar líneas, pedidos ni descuentos.

**RF-ERR-003 — Consistencia.** Un fallo no debe dejar datos parcialmente guardados ni totales que no
correspondan al carrito o pedido persistido.

**RF-ERR-004 — Cambios concurrentes.** Si el carrito o el stock cambian durante una operación, el
sistema debe informar el conflicto y refrescar o conservar un estado consistente para que el usuario
pueda decidir nuevamente.

**RF-ERR-005 — Recursos no encontrados.** Los productos y pedidos inexistentes o inaccesibles deben
mostrar estados controlados con una vía de regreso, nunca una pantalla rota.

## 18. Reglas de negocio consolidadas

| ID | Regla |
| --- | --- |
| RN-001 | Una cuenta nueva recibe siempre el rol tester. |
| RN-002 | El username es único sin distinguir mayúsculas y minúsculas. |
| RN-003 | El catálogo público contiene únicamente productos y categorías activos. |
| RN-004 | Un producto aparece como máximo una vez en el carrito activo de un usuario. |
| RN-005 | La cantidad de una línea es un entero mayor o igual a uno. |
| RN-006 | El carrito pertenece a una sola cuenta y persiste entre sesiones de esa cuenta. |
| RN-007 | El subtotal de línea es precio unitario por cantidad y el subtotal general es la suma de líneas válidas. |
| RN-008 | Los filtros activos deben cumplirse simultáneamente. |
| RN-009 | Un cupón debe existir, estar activo y encontrarse dentro de su vigencia. |
| RN-010 | El subtotal mínimo del cupón se evalúa nuevamente cuando cambia el carrito. |
| RN-011 | Un descuento porcentual se calcula sobre el subtotal completo elegible. |
| RN-012 | Un descuento fijo no puede superar el subtotal. |
| RN-013 | El total de compra es subtotal menos descuento más envío. |
| RN-014 | El carrito no reserva stock; la disponibilidad se confirma al comprar. |
| RN-015 | Una compra con stock insuficiente no crea pedido ni modifica inventario. |
| RN-016 | Una intención de compra genera un único pedido. |
| RN-017 | Una compra válida actualiza pedido, líneas, stock y carrito de manera completa. |
| RN-018 | Los datos históricos del pedido no dependen de cambios posteriores del catálogo. |
| RN-019 | Un tester solo puede acceder a sus propios datos comerciales. |
| RN-020 | Los datos financieros y de entrega usados en MercadoBugs deben ser ficticios. |

## 19. Datos de prueba autorizados

### Cuenta

El tester debe registrar una cuenta nueva con un email ficticio al que no necesite recibir mensajes.
No se proporcionan credenciales administrativas ni contraseñas compartidas.

### Catálogo inicial

El conjunto inicial contiene 40 productos activos distribuidos en siete categorías: Tecnología,
Celulares, Computación, Audio, Hogar, Gaming y Accesorios. Incluye productos con y sin stock para
permitir explorar ambos estados.

### Cupones estándar

| Código | Tipo | Beneficio | Compra mínima |
| --- | --- | --- | ---: |
| `BIENVENIDO10` | Porcentual | 10 % | US$ 0,00 |
| `TECH20` | Porcentual | 20 % | US$ 500,00 |
| `ENVIO5` | Fijo | US$ 5,00 | US$ 50,00 |

Estos códigos siguen sujetos a las reglas generales de actividad y vigencia. No deben inferirse
otros códigos válidos a partir de esta lista.

### Envío y pago

| Concepto | Opciones |
| --- | --- |
| Envío | Estándar: US$ 5,00; Express: US$ 12,00 |
| Pago | Tarjeta simulada; Transferencia simulada |

## 20. Criterios generales de aceptación

MercadoBugs cumple funcionalmente esta especificación cuando:

- un visitante puede explorar todos los productos públicos sin acceder a datos privados;
- registro, login, persistencia y logout respetan las reglas de identidad;
- búsqueda, filtros y orden producen únicamente resultados que cumplen todas las condiciones;
- las operaciones del carrito conservan una línea por producto, cantidades válidas y cálculos
  coherentes;
- los cupones se validan por existencia, estado, vigencia, mínimo y tipo de descuento;
- checkout vuelve a validar datos, precios, cupón y stock, y no deja escrituras parciales;
- cada intención de compra válida crea un pedido confirmado y reduce el stock correspondiente;
- el historial conserva datos históricos completos y permanece aislado por usuario;
- errores, estados vacíos y recursos inexistentes se presentan de forma controlada;
- un tester no puede acceder a funciones o datos reservados para otro usuario o rol.

## 21. Consideraciones para QA

Los casos de prueba deben derivarse de los requisitos identificados en este documento. Para lograr
una cobertura equilibrada se recomienda considerar:

- recorridos positivos y negativos;
- campos obligatorios, formatos y valores límite;
- extremos vacíos, mínimos, máximos y valores fuera de rango;
- combinaciones entre búsqueda, filtros y orden;
- persistencia después de refresh, logout y nuevo login;
- transiciones entre estados vacío, disponible, no disponible y confirmado;
- aislamiento entre al menos dos usuarios;
- repeticiones de acciones y concurrencia cuando resulte pertinente;
- consistencia entre resumen previo, operación confirmada e historial;
- navegación directa mediante URL y retorno desde estados de error.

Esta orientación no reemplaza el diseño de pruebas ni determina de antemano dónde se encontrará una
desviación.

## 22. Trazabilidad de requisitos

| ID | Módulo | Descripción resumida |
| --- | --- | --- |
| RF-GEN-001 | General | Navegación principal según sesión |
| RF-GEN-002 | General | Categorías y productos de Inicio |
| RF-GEN-003 | General | Formato monetario uniforme |
| RF-GEN-004 | General | Estados visibles y comprensibles |
| RF-GEN-005 | General | Uso responsive |
| RF-AUTH-001 | Autenticación | Campos obligatorios de registro |
| RF-AUTH-002 | Autenticación | Formato del username |
| RF-AUTH-003 | Autenticación | Username único sin distinguir mayúsculas |
| RF-AUTH-004 | Autenticación | Formato y unicidad del email |
| RF-AUTH-005 | Autenticación | Longitud y confirmación de contraseña |
| RF-AUTH-006 | Autenticación | Alta inmediata con rol tester |
| RF-AUTH-007 | Autenticación | Imposibilidad de elegir rol administrativo |
| RF-AUTH-008 | Autenticación | Validación del login |
| RF-AUTH-009 | Autenticación | Persistencia de sesión |
| RF-AUTH-010 | Autenticación | Protección y retorno de rutas privadas |
| RF-AUTH-011 | Autenticación | Redirección de páginas públicas de acceso |
| RF-AUTH-012 | Autenticación | Cierre persistente de sesión |
| RF-CAT-001 | Catálogo | Solo productos y categorías activos |
| RF-CAT-002 | Catálogo | Contenido de tarjetas |
| RF-CAT-003 | Catálogo | Presentación y bloqueo por falta de stock |
| RF-CAT-004 | Catálogo | Conteo y resultado vacío |
| RF-CAT-005 | Catálogo | Fotografías y fallback |
| RF-CAT-006 | Catálogo | Error de consulta y reintento |
| RF-FIL-001 | Búsqueda y filtros | Coincidencia parcial por nombre |
| RF-FIL-002 | Búsqueda y filtros | Normalización de búsqueda |
| RF-FIL-003 | Búsqueda y filtros | Restricción por categoría |
| RF-FIL-004 | Búsqueda y filtros | Precio mínimo inclusivo |
| RF-FIL-005 | Búsqueda y filtros | Precio máximo inclusivo |
| RF-FIL-006 | Búsqueda y filtros | Validación del rango |
| RF-FIL-007 | Búsqueda y filtros | Combinación conjunta de condiciones |
| RF-FIL-008 | Búsqueda y filtros | Opciones de ordenamiento |
| RF-FIL-009 | Búsqueda y filtros | Orden sobre el conjunto filtrado |
| RF-FIL-010 | Búsqueda y filtros | Persistencia de filtros en URL |
| RF-FIL-011 | Búsqueda y filtros | Limpieza completa de filtros |
| RF-PROD-001 | Producto | Información del detalle |
| RF-PROD-002 | Producto | Coherencia entre tarjeta y detalle |
| RF-PROD-003 | Producto | Navegación contextual |
| RF-PROD-004 | Producto | Agregado según stock |
| RF-PROD-005 | Producto | Estado no disponible |
| RF-CART-001 | Carrito | Acceso y carrito activo propio |
| RF-CART-002 | Carrito | Cantidad inicial |
| RF-CART-003 | Carrito | Incremento sin líneas duplicadas |
| RF-CART-004 | Carrito | Agregado intentado por visitante |
| RF-CART-005 | Carrito | Rango válido de cantidad |
| RF-CART-006 | Carrito | Controles de incremento y disminución |
| RF-CART-007 | Carrito | Corrección tras cambio de stock |
| RF-CART-008 | Carrito | Eliminar y vaciar |
| RF-CART-009 | Carrito | Línea de producto no disponible |
| RF-CART-010 | Carrito | Cálculos y contador de unidades |
| RF-CART-011 | Carrito | Uso del precio vigente |
| RF-CART-012 | Carrito | Persistencia y separación por cuenta |
| RF-CART-013 | Carrito | Condiciones para continuar al checkout |
| RF-COUP-001 | Cupones | Entrada y normalización del código |
| RF-COUP-002 | Cupones | Condiciones de validez |
| RF-COUP-003 | Cupones | Rechazo sin alterar importes |
| RF-COUP-004 | Cupones | Cálculo porcentual sobre subtotal completo |
| RF-COUP-005 | Cupones | Cálculo y límite del descuento fijo |
| RF-COUP-006 | Cupones | Prohibición de importes negativos |
| RF-COUP-007 | Cupones | Presentación del beneficio |
| RF-COUP-008 | Cupones | Persistencia del cupón |
| RF-COUP-009 | Cupones | Reevaluación ante cambios |
| RF-COUP-010 | Cupones | Eliminación y recálculo |
| RF-CHK-001 | Checkout | Precondiciones generales |
| RF-CHK-002 | Checkout | Validación del nombre de entrega |
| RF-CHK-003 | Checkout | Validación de dirección |
| RF-CHK-004 | Checkout | Validación de ciudad |
| RF-CHK-005 | Checkout | Validación de código postal |
| RF-CHK-006 | Checkout | Envío estándar |
| RF-CHK-007 | Checkout | Envío express y selección única |
| RF-CHK-008 | Checkout | Métodos de pago simulados |
| RF-CHK-009 | Checkout | Revalidación de datos e importes |
| RF-CHK-010 | Checkout | Fórmula y consistencia del total |
| RF-CHK-011 | Checkout | Una intención produce un pedido |
| RF-CHK-012 | Checkout | Operación completa o reversión ante fallo |
| RF-CHK-013 | Checkout | Resultado de compra exitosa |
| RF-CHK-014 | Checkout | Nuevo carrito tras la compra |
| RF-STK-001 | Stock | Carrito sin reserva de inventario |
| RF-STK-002 | Stock | Validación al confirmar |
| RF-STK-003 | Stock | Rechazo íntegro por insuficiencia |
| RF-STK-004 | Stock | Descuento exacto y stock no negativo |
| RF-ORD-001 | Pedidos | Historial propio |
| RF-ORD-002 | Pedidos | Orden y límite de 50 |
| RF-ORD-003 | Pedidos | Resumen en historial |
| RF-ORD-004 | Pedidos | Estados admitidos |
| RF-ORD-005 | Pedidos | Líneas históricas |
| RF-ORD-006 | Pedidos | Resumen financiero histórico |
| RF-ORD-007 | Pedidos | Datos de entrega y pago |
| RF-ORD-008 | Pedidos | Inmutabilidad de los datos históricos |
| RF-ORD-009 | Pedidos | Recurso inexistente o ajeno |
| RF-ORD-010 | Pedidos | Pedidos de solo lectura |
| RF-SEC-001 | Seguridad funcional | Aislamiento del carrito |
| RF-SEC-002 | Seguridad funcional | Aislamiento de pedidos |
| RF-SEC-003 | Seguridad funcional | Restricciones del visitante |
| RF-SEC-004 | Seguridad funcional | Bloqueo de administración para tester |
| RF-SEC-005 | Seguridad funcional | Rol no manipulable desde navegador |
| RF-SEC-006 | Seguridad funcional | Protección de datos comerciales |
| RF-ERR-001 | Manejo de errores | Mensajes comprensibles |
| RF-ERR-002 | Manejo de errores | Reintentos sin duplicación |
| RF-ERR-003 | Manejo de errores | Consistencia ante fallos |
| RF-ERR-004 | Manejo de errores | Conflictos por cambios concurrentes |
| RF-ERR-005 | Manejo de errores | Recursos no encontrados controlados |
