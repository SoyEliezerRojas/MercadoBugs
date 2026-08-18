do $$
declare
  updated_products integer;
begin
  update public.products as product
  set image_url = image_map.image_url
  from (
    values
      ('reloj-tempo-s', 'products/reloj-tempo-s.webp'),
      ('camara-lumen-pocket', 'products/camara-lumen-pocket.webp'),
      ('ereader-pageflow-7', 'products/ereader-pageflow-7.webp'),
      ('drone-aeroscout-mini', 'products/drone-aeroscout-mini.webp'),
      ('tablet-canvas-tab-11', 'products/tablet-canvas-tab-11.webp'),
      ('smartphone-nova-x', 'products/smartphone-nova-x.webp'),
      ('smartphone-nova-lite', 'products/smartphone-nova-lite.webp'),
      ('smartphone-orbit-max', 'products/smartphone-orbit-max.webp'),
      ('telefono-flux-mini', 'products/telefono-flux-mini.webp'),
      ('smartphone-vega-pro', 'products/smartphone-vega-pro.webp'),
      ('notebook-novabook-14', 'products/notebook-novabook-14.webp'),
      ('ultrabook-aster-air-13', 'products/ultrabook-aster-air-13.webp'),
      ('mini-pc-corenest', 'products/mini-pc-corenest.webp'),
      ('monitor-horizon-27', 'products/monitor-horizon-27.webp'),
      ('ssd-flashcore-1tb', 'products/ssd-flashcore-1tb.webp'),
      ('memoria-quantum-16gb', 'products/memoria-quantum-16gb.webp'),
      ('router-airlink-ax3000', 'products/router-airlink-ax3000.webp'),
      ('auriculares-echowave', 'products/auriculares-echowave.webp'),
      ('parlante-orbit-mini', 'products/parlante-orbit-mini.webp'),
      ('barra-sonora-beam', 'products/barra-sonora-beam.webp'),
      ('microfono-clearcast-usb', 'products/microfono-clearcast-usb.webp'),
      ('auriculares-quietarc', 'products/auriculares-quietarc.webp'),
      ('tocadiscos-retrospin', 'products/tocadiscos-retrospin.webp'),
      ('aspiradora-homepilot', 'products/aspiradora-homepilot.webp'),
      ('cafetera-brewmate', 'products/cafetera-brewmate.webp'),
      ('lampara-lumidesk', 'products/lampara-lumidesk.webp'),
      ('purificador-airleaf', 'products/purificador-airleaf.webp'),
      ('balanza-cookscale', 'products/balanza-cookscale.webp'),
      ('teclado-pulse-mechanical', 'products/teclado-pulse-mechanical.webp'),
      ('mouse-vertex-pro', 'products/mouse-vertex-pro.webp'),
      ('gamepad-novacontrol', 'products/gamepad-novacontrol.webp'),
      ('silla-arena-comfort', 'products/silla-arena-comfort.webp'),
      ('monitor-rift-24', 'products/monitor-rift-24.webp'),
      ('headset-battletone', 'products/headset-battletone.webp'),
      ('webcam-vision-hd', 'products/webcam-vision-hd.webp'),
      ('hub-dockflow-8', 'products/hub-dockflow-8.webp'),
      ('cargador-voltgan-65w', 'products/cargador-voltgan-65w.webp'),
      ('mochila-urbanshell', 'products/mochila-urbanshell.webp'),
      ('soporte-liftstand', 'products/soporte-liftstand.webp'),
      ('cable-flexlink-usbc', 'products/cable-flexlink-usbc.webp')
  ) as image_map(slug, image_url)
  where product.slug = image_map.slug;

  get diagnostics updated_products = row_count;

  if updated_products <> 40 then
    raise exception 'Expected to update 40 product images, updated %', updated_products;
  end if;
end;
$$;
