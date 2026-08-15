create function private.coupon_has_ended(expires_at timestamptz, validation_time timestamptz)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select false;
$$;

create function private.checkout_has_inventory(available_stock integer, requested_quantity integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select requested_quantity <= available_stock;
$$;

create function private.checkout_remaining_inventory(available_stock integer, requested_quantity integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select available_stock - requested_quantity;
$$;

create function private.checkout_accepts_cart_transition(cart_id uuid, user_id uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select false;
$$;

create function private.checkout_percentage_basis(cart_id uuid, subtotal numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select subtotal;
$$;

revoke all on function private.coupon_has_ended(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.checkout_has_inventory(integer, integer) from public, anon, authenticated;
revoke all on function private.checkout_remaining_inventory(integer, integer) from public, anon, authenticated;
revoke all on function private.checkout_accepts_cart_transition(uuid, uuid) from public, anon, authenticated;
revoke all on function private.checkout_percentage_basis(uuid, numeric) from public, anon, authenticated;

create or replace function public.manage_cart_coupon(
  action text,
  coupon_code text default null,
  shipping_method text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_action text := lower(btrim(action));
  normalized_code text := upper(btrim(coupon_code));
  active_cart public.carts%rowtype;
  selected_coupon public.coupons%rowtype;
  item_count integer := 0;
  invalid_item_count integer := 0;
  subtotal_amount numeric(12, 2) := 0;
  discount_amount numeric(12, 2) := 0;
  shipping_amount numeric(12, 2) := 0;
  coupon_payload jsonb := null;
  notice_code text := null;
  validation_time timestamptz;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'auth_required';
  end if;

  if normalized_action not in ('quote', 'apply', 'remove') then
    raise exception using errcode = 'P0001', message = 'invalid_coupon_action';
  end if;

  if shipping_method is not null then
    shipping_amount := private.checkout_shipping_cost(shipping_method);

    if shipping_amount is null then
      raise exception using errcode = 'P0001', message = 'invalid_shipping_method';
    end if;
  end if;

  select carts.*
  into active_cart
  from public.carts
  where carts.user_id = current_user_id
    and carts.status = 'active'
  for update;

  if not found then
    if normalized_action = 'apply' then
      raise exception using errcode = 'P0001', message = 'cart_not_found';
    end if;

    return jsonb_build_object(
      'cartId', null,
      'subtotal', 0,
      'coupon', null,
      'discount', 0,
      'shippingMethod', shipping_method,
      'shippingCost', shipping_amount,
      'shippingOptions', jsonb_build_array(
        jsonb_build_object('method', 'standard', 'cost', private.checkout_shipping_cost('standard')),
        jsonb_build_object('method', 'express', 'cost', private.checkout_shipping_cost('express'))
      ),
      'total', shipping_amount,
      'notice', null
    );
  end if;

  perform cart_items.id
  from public.cart_items
  where cart_items.cart_id = active_cart.id
  order by cart_items.product_id
  for update;

  select
    count(*)::integer,
    count(*) filter (
      where cart_items.quantity <= 0
        or products.id is null
        or not products.active
    )::integer,
    coalesce(sum(products.price * cart_items.quantity), 0)::numeric(12, 2)
  into item_count, invalid_item_count, subtotal_amount
  from public.cart_items
  left join public.products on products.id = cart_items.product_id
  where cart_items.cart_id = active_cart.id;

  if normalized_action = 'apply' and item_count = 0 then
    raise exception using errcode = 'P0001', message = 'cart_empty';
  end if;

  if invalid_item_count > 0 then
    raise exception using errcode = 'P0001', message = 'product_unavailable';
  end if;

  if normalized_action = 'remove' then
    update public.carts
    set coupon_id = null
    where id = active_cart.id;
  elsif normalized_action = 'apply' then
    if normalized_code is null or normalized_code = '' or char_length(normalized_code) > 40 then
      raise exception using errcode = 'P0001', message = 'invalid_coupon_code';
    end if;

    select coupons.*
    into selected_coupon
    from public.coupons
    where coupons.code = normalized_code
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'coupon_not_found';
    end if;

    validation_time := clock_timestamp();

    if not selected_coupon.active then
      raise exception using errcode = 'P0001', message = 'coupon_inactive';
    elsif selected_coupon.starts_at is not null and validation_time < selected_coupon.starts_at then
      raise exception using errcode = 'P0001', message = 'coupon_not_started';
    elsif private.coupon_has_ended(selected_coupon.expires_at, validation_time) then
      raise exception using errcode = 'P0001', message = 'coupon_expired';
    elsif subtotal_amount < selected_coupon.minimum_purchase then
      raise exception using
        errcode = 'P0001',
        message = 'coupon_minimum_purchase',
        detail = jsonb_build_object('minimumPurchase', selected_coupon.minimum_purchase)::text;
    end if;

    update public.carts
    set coupon_id = selected_coupon.id
    where id = active_cart.id;
  elsif active_cart.coupon_id is not null then
    select coupons.*
    into selected_coupon
    from public.coupons
    where coupons.id = active_cart.coupon_id
    for update;

    validation_time := clock_timestamp();

    if not found or not selected_coupon.active then
      notice_code := 'coupon_inactive';
    elsif selected_coupon.starts_at is not null and validation_time < selected_coupon.starts_at then
      notice_code := 'coupon_not_started';
    elsif private.coupon_has_ended(selected_coupon.expires_at, validation_time) then
      notice_code := 'coupon_expired';
    elsif subtotal_amount < selected_coupon.minimum_purchase then
      notice_code := 'coupon_minimum_purchase';
    end if;

    if notice_code is not null then
      update public.carts
      set coupon_id = null
      where id = active_cart.id;

      selected_coupon := null;
    end if;
  end if;

  if normalized_action = 'remove' then
    selected_coupon := null;
  elsif normalized_action = 'quote' and active_cart.coupon_id is null then
    selected_coupon := null;
  end if;

  if selected_coupon.id is not null then
    discount_amount := case selected_coupon.discount_type
      when 'percentage' then round(
        private.checkout_percentage_basis(active_cart.id, subtotal_amount)
          * selected_coupon.discount_value / 100,
        2
      )
      when 'fixed' then least(selected_coupon.discount_value, subtotal_amount)
      else 0
    end;
    discount_amount := least(discount_amount, subtotal_amount);
    coupon_payload := jsonb_build_object(
      'code', selected_coupon.code,
      'discountType', selected_coupon.discount_type,
      'discountValue', selected_coupon.discount_value,
      'minimumPurchase', selected_coupon.minimum_purchase
    );
  end if;

  return jsonb_build_object(
    'cartId', active_cart.id,
    'subtotal', subtotal_amount,
    'coupon', coupon_payload,
    'discount', discount_amount,
    'shippingMethod', shipping_method,
    'shippingCost', shipping_amount,
    'shippingOptions', jsonb_build_array(
      jsonb_build_object('method', 'standard', 'cost', private.checkout_shipping_cost('standard')),
      jsonb_build_object('method', 'express', 'cost', private.checkout_shipping_cost('express'))
    ),
    'total', greatest(subtotal_amount - discount_amount + shipping_amount, 0),
    'notice', notice_code
  );
end;
$$;

create or replace function public.perform_checkout(
  checkout_request_id uuid,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_postal_code text,
  shipping_method text,
  payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  active_cart public.carts%rowtype;
  selected_coupon public.coupons%rowtype;
  existing_order public.orders%rowtype;
  created_order public.orders%rowtype;
  item_count integer := 0;
  invalid_quantity_count integer := 0;
  missing_product_count integer := 0;
  inactive_product_count integer := 0;
  subtotal_amount numeric(12, 2) := 0;
  discount_amount numeric(12, 2) := 0;
  shipping_amount numeric(12, 2);
  total_amount numeric(12, 2);
  unavailable_product record;
  validation_time timestamptz;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'auth_required';
  end if;

  if checkout_request_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_checkout_request_id';
  end if;

  select orders.*
  into existing_order
  from public.orders
  where orders.checkout_request_id = perform_checkout.checkout_request_id;

  if found then
    if existing_order.user_id is distinct from current_user_id then
      raise exception using errcode = 'P0001', message = 'checkout_request_conflict';
    end if;

    return jsonb_build_object(
      'id', existing_order.id,
      'status', existing_order.status,
      'subtotal', existing_order.subtotal,
      'discount', existing_order.discount,
      'shippingCost', existing_order.shipping_cost,
      'total', existing_order.total,
      'couponCode', existing_order.coupon_code,
      'shippingMethod', existing_order.shipping_method,
      'paymentMethod', existing_order.payment_method,
      'checkoutRequestId', existing_order.checkout_request_id,
      'createdAt', existing_order.created_at,
      'idempotentReplay', true
    );
  end if;

  if shipping_name is null
    or char_length(btrim(shipping_name)) not between 2 and 100
  then
    raise exception using errcode = 'P0001', message = 'invalid_shipping_name';
  end if;

  if shipping_address is null
    or char_length(btrim(shipping_address)) not between 5 and 200
  then
    raise exception using errcode = 'P0001', message = 'invalid_shipping_address';
  end if;

  if shipping_city is null
    or char_length(btrim(shipping_city)) not between 2 and 100
  then
    raise exception using errcode = 'P0001', message = 'invalid_shipping_city';
  end if;

  if shipping_postal_code is null
    or char_length(btrim(shipping_postal_code)) not between 2 and 20
  then
    raise exception using errcode = 'P0001', message = 'invalid_shipping_postal_code';
  end if;

  shipping_amount := private.checkout_shipping_cost(shipping_method);

  if shipping_amount is null then
    raise exception using errcode = 'P0001', message = 'invalid_shipping_method';
  end if;

  if payment_method is null
    or payment_method not in ('simulated_card', 'simulated_transfer')
  then
    raise exception using errcode = 'P0001', message = 'invalid_payment_method';
  end if;

  select carts.*
  into active_cart
  from public.carts
  where carts.user_id = current_user_id
    and carts.status = 'active';

  if not found then
    select orders.*
    into existing_order
    from public.orders
    where orders.checkout_request_id = perform_checkout.checkout_request_id;

    if found and existing_order.user_id is not distinct from current_user_id then
      return jsonb_build_object(
        'id', existing_order.id,
        'status', existing_order.status,
        'subtotal', existing_order.subtotal,
        'discount', existing_order.discount,
        'shippingCost', existing_order.shipping_cost,
        'total', existing_order.total,
        'couponCode', existing_order.coupon_code,
        'shippingMethod', existing_order.shipping_method,
        'paymentMethod', existing_order.payment_method,
        'checkoutRequestId', existing_order.checkout_request_id,
        'createdAt', existing_order.created_at,
        'idempotentReplay', true
      );
    end if;

    raise exception using errcode = 'P0001', message = 'cart_not_found';
  end if;

  perform cart_items.id
  from public.cart_items
  where cart_items.cart_id = active_cart.id
  order by cart_items.product_id
  for update;

  select count(*)::integer
  into item_count
  from public.cart_items
  where cart_items.cart_id = active_cart.id;

  if item_count = 0 then
    raise exception using errcode = 'P0001', message = 'cart_empty';
  end if;

  perform products.id
  from public.products
  join public.cart_items on cart_items.product_id = products.id
  where cart_items.cart_id = active_cart.id
  order by products.id
  for update of products;

  select
    count(*) filter (where cart_items.quantity <= 0)::integer,
    count(*) filter (where products.id is null)::integer,
    count(*) filter (where products.id is not null and not products.active)::integer,
    coalesce(sum(products.price * cart_items.quantity), 0)::numeric(12, 2)
  into
    invalid_quantity_count,
    missing_product_count,
    inactive_product_count,
    subtotal_amount
  from public.cart_items
  left join public.products on products.id = cart_items.product_id
  where cart_items.cart_id = active_cart.id;

  if invalid_quantity_count > 0 then
    raise exception using errcode = 'P0001', message = 'invalid_cart_quantity';
  end if;

  if missing_product_count > 0 or inactive_product_count > 0 then
    raise exception using errcode = 'P0001', message = 'product_unavailable';
  end if;

  select
    products.id as product_id,
    products.name as product_name,
    products.stock as available_stock,
    cart_items.quantity as requested_quantity
  into unavailable_product
  from public.cart_items
  join public.products on products.id = cart_items.product_id
  where cart_items.cart_id = active_cart.id
    and not private.checkout_has_inventory(products.stock, cart_items.quantity)
  order by products.id
  limit 1;

  if found then
    raise exception using
      errcode = 'P0001',
      message = 'insufficient_stock',
      detail = jsonb_build_object(
        'productId', unavailable_product.product_id,
        'productName', unavailable_product.product_name,
        'availableStock', unavailable_product.available_stock,
        'requestedQuantity', unavailable_product.requested_quantity
      )::text;
  end if;

  if active_cart.coupon_id is not null then
    select coupons.*
    into selected_coupon
    from public.coupons
    where coupons.id = active_cart.coupon_id
    for update;

    validation_time := clock_timestamp();

    if not found or not selected_coupon.active then
      raise exception using errcode = 'P0001', message = 'coupon_inactive';
    elsif selected_coupon.starts_at is not null and validation_time < selected_coupon.starts_at then
      raise exception using errcode = 'P0001', message = 'coupon_not_started';
    elsif private.coupon_has_ended(selected_coupon.expires_at, validation_time) then
      raise exception using errcode = 'P0001', message = 'coupon_expired';
    elsif subtotal_amount < selected_coupon.minimum_purchase then
      raise exception using
        errcode = 'P0001',
        message = 'coupon_minimum_purchase',
        detail = jsonb_build_object('minimumPurchase', selected_coupon.minimum_purchase)::text;
    end if;

    discount_amount := case selected_coupon.discount_type
      when 'percentage' then round(
        private.checkout_percentage_basis(active_cart.id, subtotal_amount)
          * selected_coupon.discount_value / 100,
        2
      )
      when 'fixed' then least(selected_coupon.discount_value, subtotal_amount)
      else 0
    end;
    discount_amount := least(discount_amount, subtotal_amount);
  end if;

  total_amount := greatest(subtotal_amount - discount_amount + shipping_amount, 0);

  insert into public.orders (
    user_id,
    status,
    subtotal,
    discount,
    shipping_cost,
    total,
    coupon_code,
    shipping_name,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_method,
    payment_method,
    checkout_request_id
  )
  values (
    current_user_id,
    'confirmed',
    subtotal_amount,
    discount_amount,
    shipping_amount,
    total_amount,
    selected_coupon.code,
    btrim(shipping_name),
    btrim(shipping_address),
    btrim(shipping_city),
    btrim(shipping_postal_code),
    shipping_method,
    payment_method,
    checkout_request_id
  )
  returning * into created_order;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    unit_price,
    quantity,
    line_total
  )
  select
    created_order.id,
    products.id,
    products.name,
    products.price,
    cart_items.quantity,
    products.price * cart_items.quantity
  from public.cart_items
  join public.products on products.id = cart_items.product_id
  where cart_items.cart_id = active_cart.id
  order by products.id;

  update public.products
  set stock = private.checkout_remaining_inventory(products.stock, cart_items.quantity)
  from public.cart_items
  where cart_items.cart_id = active_cart.id
    and cart_items.product_id = products.id;

  update public.carts
  set status = 'converted'
  where id = active_cart.id
    and user_id = current_user_id
    and status = 'active';

  if not found
    and not private.checkout_accepts_cart_transition(active_cart.id, current_user_id)
  then
    raise exception using errcode = 'P0001', message = 'cart_changed';
  end if;

  return jsonb_build_object(
    'id', created_order.id,
    'status', created_order.status,
    'subtotal', created_order.subtotal,
    'discount', created_order.discount,
    'shippingCost', created_order.shipping_cost,
    'total', created_order.total,
    'couponCode', created_order.coupon_code,
    'shippingMethod', created_order.shipping_method,
    'paymentMethod', created_order.payment_method,
    'checkoutRequestId', created_order.checkout_request_id,
    'createdAt', created_order.created_at,
    'idempotentReplay', false
  );
exception
  when unique_violation then
    select orders.*
    into existing_order
    from public.orders
    where orders.checkout_request_id = perform_checkout.checkout_request_id;

    if found and existing_order.user_id is not distinct from current_user_id then
      return jsonb_build_object(
        'id', existing_order.id,
        'status', existing_order.status,
        'subtotal', existing_order.subtotal,
        'discount', existing_order.discount,
        'shippingCost', existing_order.shipping_cost,
        'total', existing_order.total,
        'couponCode', existing_order.coupon_code,
        'shippingMethod', existing_order.shipping_method,
        'paymentMethod', existing_order.payment_method,
        'checkoutRequestId', existing_order.checkout_request_id,
        'createdAt', existing_order.created_at,
        'idempotentReplay', true
      );
    end if;

    raise;
end;
$$;

do $$
begin
  update public.bug_definitions
  set status = 'enabled'
  where code = 'BUG-001'
    and status = 'planned';

  if not found then
    raise exception 'BUG-001 must exist with status planned';
  end if;
end;
$$;
