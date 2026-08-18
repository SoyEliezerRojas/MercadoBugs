insert into public.categories (name, slug, description)
values
  ('Tecnología', 'tecnologia', 'Dispositivos inteligentes y electrónica para el día a día.'),
  ('Celulares', 'celulares', 'Smartphones ficticios para distintas necesidades.'),
  ('Computación', 'computacion', 'Equipos, componentes y conectividad.'),
  ('Audio', 'audio', 'Sonido personal y para el hogar.'),
  ('Hogar', 'hogar', 'Tecnología y pequeños electrodomésticos para el hogar.'),
  ('Gaming', 'gaming', 'Periféricos y equipamiento para jugar.'),
  ('Accesorios', 'accesorios', 'Complementos para dispositivos y estaciones de trabajo.')
on conflict (slug) do nothing;

insert into public.products (
  category_id,
  name,
  slug,
  description,
  price,
  stock,
  image_url
)
values
  ((select id from public.categories where slug = 'tecnologia'), 'Reloj inteligente Tempo S', 'reloj-tempo-s', 'Reloj inteligente con seguimiento de actividad y pantalla de alto contraste.', 189.90, 34, 'products/reloj-tempo-s.webp'),
  ((select id from public.categories where slug = 'tecnologia'), 'Cámara compacta Lumen Pocket', 'camara-lumen-pocket', 'Cámara compacta ficticia con zoom óptico y estabilización.', 459.00, 8, 'products/camara-lumen-pocket.webp'),
  ((select id from public.categories where slug = 'tecnologia'), 'E-reader PageFlow 7', 'ereader-pageflow-7', 'Lector digital de siete pulgadas con luz cálida regulable.', 149.50, 20, 'products/ereader-pageflow-7.webp'),
  ((select id from public.categories where slug = 'tecnologia'), 'Drone AeroScout Mini', 'drone-aeroscout-mini', 'Drone compacto de entrenamiento con cámara simulada y control estable.', 279.99, 2, 'products/drone-aeroscout-mini.webp'),
  ((select id from public.categories where slug = 'tecnologia'), 'Tablet Canvas Tab 11', 'tablet-canvas-tab-11', 'Tablet versátil para contenido, estudio y tareas cotidianas.', 429.00, 15, 'products/tablet-canvas-tab-11.webp'),

  ((select id from public.categories where slug = 'celulares'), 'Smartphone Nova X', 'smartphone-nova-x', 'Smartphone equilibrado con pantalla nítida y batería de larga duración.', 749.90, 25, 'products/smartphone-nova-x.webp'),
  ((select id from public.categories where slug = 'celulares'), 'Smartphone Nova Lite', 'smartphone-nova-lite', 'Modelo accesible y liviano para comunicación y aplicaciones esenciales.', 379.90, 0, 'products/smartphone-nova-lite.webp'),
  ((select id from public.categories where slug = 'celulares'), 'Smartphone Orbit Max', 'smartphone-orbit-max', 'Pantalla amplia, gran autonomía y almacenamiento expandido.', 629.50, 3, 'products/smartphone-orbit-max.webp'),
  ((select id from public.categories where slug = 'celulares'), 'Teléfono Flux Mini', 'telefono-flux-mini', 'Teléfono compacto pensado para uso simple con una sola mano.', 249.00, 1, 'products/telefono-flux-mini.webp'),
  ((select id from public.categories where slug = 'celulares'), 'Smartphone Vega Pro', 'smartphone-vega-pro', 'Equipo avanzado con cámara múltiple y pantalla de alta frecuencia.', 899.00, 18, 'products/smartphone-vega-pro.webp'),

  ((select id from public.categories where slug = 'computacion'), 'Notebook NovaBook 14', 'notebook-novabook-14', 'Notebook portátil de catorce pulgadas para productividad diaria.', 1099.00, 12, 'products/notebook-novabook-14.webp'),
  ((select id from public.categories where slug = 'computacion'), 'Ultrabook Aster Air 13', 'ultrabook-aster-air-13', 'Equipo delgado con autonomía extendida y construcción liviana.', 1399.90, 5, 'products/ultrabook-aster-air-13.webp'),
  ((select id from public.categories where slug = 'computacion'), 'Mini PC CoreNest', 'mini-pc-corenest', 'Computadora compacta para escritorio con múltiples puertos.', 589.00, 9, 'products/mini-pc-corenest.webp'),
  ((select id from public.categories where slug = 'computacion'), 'Monitor Horizon 27', 'monitor-horizon-27', 'Monitor de veintisiete pulgadas con panel de alta definición.', 329.99, 16, 'products/monitor-horizon-27.webp'),
  ((select id from public.categories where slug = 'computacion'), 'SSD FlashCore 1TB', 'ssd-flashcore-1tb', 'Unidad de estado sólido de alta velocidad con un terabyte.', 119.90, 60, 'products/ssd-flashcore-1tb.webp'),
  ((select id from public.categories where slug = 'computacion'), 'Memoria RAM Quantum 16GB', 'memoria-quantum-16gb', 'Módulo de memoria ficticio para equipos de escritorio.', 74.50, 42, 'products/memoria-quantum-16gb.webp'),
  ((select id from public.categories where slug = 'computacion'), 'Router AirLink AX3000', 'router-airlink-ax3000', 'Router inalámbrico de doble banda para hogares conectados.', 159.00, 0, 'products/router-airlink-ax3000.webp'),

  ((select id from public.categories where slug = 'audio'), 'Auriculares EchoWave', 'auriculares-echowave', 'Auriculares inalámbricos cómodos con sonido equilibrado.', 129.90, 28, 'products/auriculares-echowave.webp'),
  ((select id from public.categories where slug = 'audio'), 'Parlante Orbit Mini', 'parlante-orbit-mini', 'Parlante portátil resistente para escuchar música en cualquier espacio.', 64.90, 75, 'products/parlante-orbit-mini.webp'),
  ((select id from public.categories where slug = 'audio'), 'Barra de sonido Sonora Beam', 'barra-sonora-beam', 'Barra compacta para mejorar diálogos y música del televisor.', 249.00, 7, 'products/barra-sonora-beam.webp'),
  ((select id from public.categories where slug = 'audio'), 'Micrófono ClearCast USB', 'microfono-clearcast-usb', 'Micrófono de escritorio para reuniones y creación de contenido.', 94.50, 11, 'products/microfono-clearcast-usb.webp'),
  ((select id from public.categories where slug = 'audio'), 'Auriculares QuietArc', 'auriculares-quietarc', 'Auriculares circumaurales con aislamiento pasivo confortable.', 219.90, 4, 'products/auriculares-quietarc.webp'),
  ((select id from public.categories where slug = 'audio'), 'Tocadiscos RetroSpin', 'tocadiscos-retrospin', 'Tocadiscos decorativo con salida de audio integrada.', 199.00, 1, 'products/tocadiscos-retrospin.webp'),

  ((select id from public.categories where slug = 'hogar'), 'Aspiradora HomePilot', 'aspiradora-homepilot', 'Aspiradora autónoma ficticia con programación por horarios.', 389.00, 6, 'products/aspiradora-homepilot.webp'),
  ((select id from public.categories where slug = 'hogar'), 'Cafetera BrewMate', 'cafetera-brewmate', 'Cafetera compacta con intensidad y volumen configurables.', 139.90, 14, 'products/cafetera-brewmate.webp'),
  ((select id from public.categories where slug = 'hogar'), 'Lámpara LumiDesk', 'lampara-lumidesk', 'Lámpara de escritorio regulable con iluminación cálida y fría.', 54.90, 38, 'products/lampara-lumidesk.webp'),
  ((select id from public.categories where slug = 'hogar'), 'Purificador AirLeaf', 'purificador-airleaf', 'Purificador silencioso para habitaciones medianas.', 229.00, 0, 'products/purificador-airleaf.webp'),
  ((select id from public.categories where slug = 'hogar'), 'Balanza CookScale', 'balanza-cookscale', 'Balanza digital de cocina con lectura precisa y diseño compacto.', 34.50, 90, 'products/balanza-cookscale.webp'),

  ((select id from public.categories where slug = 'gaming'), 'Teclado Pulse Mechanical', 'teclado-pulse-mechanical', 'Teclado mecánico sobrio con retroiluminación regulable.', 114.90, 22, 'products/teclado-pulse-mechanical.webp'),
  ((select id from public.categories where slug = 'gaming'), 'Mouse Vertex Pro', 'mouse-vertex-pro', 'Mouse preciso con botones configurables y diseño ergonómico.', 69.90, 55, 'products/mouse-vertex-pro.webp'),
  ((select id from public.categories where slug = 'gaming'), 'Gamepad NovaControl', 'gamepad-novacontrol', 'Control inalámbrico compatible con la estación de juego ficticia.', 79.00, 19, 'products/gamepad-novacontrol.webp'),
  ((select id from public.categories where slug = 'gaming'), 'Silla Arena Comfort', 'silla-arena-comfort', 'Silla ajustable con soporte lumbar para sesiones prolongadas.', 299.00, 2, 'products/silla-arena-comfort.webp'),
  ((select id from public.categories where slug = 'gaming'), 'Monitor Rift 24', 'monitor-rift-24', 'Monitor de veinticuatro pulgadas con respuesta rápida.', 259.90, 10, 'products/monitor-rift-24.webp'),
  ((select id from public.categories where slug = 'gaming'), 'Headset BattleTone', 'headset-battletone', 'Headset con micrófono flexible y controles integrados.', 89.50, 0, 'products/headset-battletone.webp'),

  ((select id from public.categories where slug = 'accesorios'), 'Webcam Vision HD', 'webcam-vision-hd', 'Cámara web de alta definición con soporte ajustable.', 59.90, 44, 'products/webcam-vision-hd.webp'),
  ((select id from public.categories where slug = 'accesorios'), 'Hub DockFlow 8', 'hub-dockflow-8', 'Concentrador de ocho conexiones para ampliar el escritorio.', 84.90, 17, 'products/hub-dockflow-8.webp'),
  ((select id from public.categories where slug = 'accesorios'), 'Cargador VoltGaN 65W', 'cargador-voltgan-65w', 'Cargador compacto de potencia adaptable para dispositivos compatibles.', 49.90, 65, 'products/cargador-voltgan-65w.webp'),
  ((select id from public.categories where slug = 'accesorios'), 'Mochila UrbanShell', 'mochila-urbanshell', 'Mochila resistente con compartimento acolchado para notebook.', 72.00, 13, 'products/mochila-urbanshell.webp'),
  ((select id from public.categories where slug = 'accesorios'), 'Soporte LiftStand', 'soporte-liftstand', 'Soporte plegable para elevar notebooks y mejorar la postura.', 39.90, 31, 'products/soporte-liftstand.webp'),
  ((select id from public.categories where slug = 'accesorios'), 'Cable FlexLink USB-C', 'cable-flexlink-usbc', 'Cable trenzado reforzado para carga y transferencia de datos.', 18.90, 120, 'products/cable-flexlink-usbc.webp')
on conflict (slug) do nothing;

insert into public.coupons (
  code,
  description,
  discount_type,
  discount_value,
  minimum_purchase,
  starts_at,
  expires_at,
  active
)
values
  ('BIENVENIDO10', 'Diez por ciento para una primera compra simulada.', 'percentage', 10.00, 0.00, '2026-01-01 00:00:00+00', null, true),
  ('TECH20', 'Veinte por ciento en compras tecnológicas desde 500.', 'percentage', 20.00, 500.00, '2026-01-01 00:00:00+00', null, true),
  ('ENVIO5', 'Descuento fijo de cinco unidades desde una compra de 50.', 'fixed', 5.00, 50.00, '2026-01-01 00:00:00+00', null, true),
  ('OLD20', 'Cupón promocional histórico ya vencido.', 'percentage', 20.00, 0.00, '2024-01-01 00:00:00+00', '2024-12-31 23:59:59+00', true)
on conflict (code) do nothing;
