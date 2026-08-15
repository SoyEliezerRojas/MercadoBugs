create extension if not exists pgcrypto with schema extensions;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  role text not null default 'tester',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username),
  constraint profiles_username_length check (char_length(username) between 3 and 20),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]+$'),
  constraint profiles_role_valid check (role in ('tester', 'admin'))
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (char_length(btrim(name)) > 0),
  constraint categories_slug_not_blank check (char_length(btrim(slug)) > 0),
  constraint categories_slug_unique unique (slug)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null,
  price numeric(12, 2) not null,
  stock integer not null default 0,
  image_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (char_length(btrim(name)) > 0),
  constraint products_slug_not_blank check (char_length(btrim(slug)) > 0),
  constraint products_slug_unique unique (slug),
  constraint products_description_not_blank check (char_length(btrim(description)) > 0),
  constraint products_price_non_negative check (price >= 0),
  constraint products_stock_non_negative check (stock >= 0),
  constraint products_image_url_not_blank check (char_length(btrim(image_url)) > 0)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  discount_type text not null,
  discount_value numeric(12, 2) not null,
  minimum_purchase numeric(12, 2) not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_code_unique unique (code),
  constraint coupons_code_not_blank check (char_length(btrim(code)) > 0),
  constraint coupons_code_uppercase check (code = upper(code)),
  constraint coupons_description_not_blank check (char_length(btrim(description)) > 0),
  constraint coupons_discount_type_valid check (discount_type in ('percentage', 'fixed')),
  constraint coupons_discount_value_positive check (discount_value > 0),
  constraint coupons_percentage_range check (
    discount_type <> 'percentage' or discount_value <= 100
  ),
  constraint coupons_minimum_purchase_non_negative check (minimum_purchase >= 0),
  constraint coupons_date_range_valid check (
    starts_at is null or expires_at is null or expires_at > starts_at
  )
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active',
  coupon_id uuid references public.coupons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_status_valid check (status in ('active', 'converted', 'abandoned'))
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_positive check (quantity > 0),
  constraint cart_items_cart_product_unique unique (cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending',
  subtotal numeric(12, 2) not null,
  discount numeric(12, 2) not null default 0,
  shipping_cost numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  coupon_code text,
  shipping_name text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postal_code text not null,
  shipping_method text not null,
  payment_method text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_valid check (status in ('pending', 'confirmed', 'cancelled')),
  constraint orders_subtotal_non_negative check (subtotal >= 0),
  constraint orders_discount_non_negative check (discount >= 0),
  constraint orders_discount_not_above_subtotal check (discount <= subtotal),
  constraint orders_shipping_cost_non_negative check (shipping_cost >= 0),
  constraint orders_total_non_negative check (total >= 0),
  constraint orders_total_matches_components check (
    total = subtotal - discount + shipping_cost
  ),
  constraint orders_coupon_code_not_blank check (
    coupon_code is null or char_length(btrim(coupon_code)) > 0
  ),
  constraint orders_shipping_name_not_blank check (char_length(btrim(shipping_name)) > 0),
  constraint orders_shipping_address_not_blank check (char_length(btrim(shipping_address)) > 0),
  constraint orders_shipping_city_not_blank check (char_length(btrim(shipping_city)) > 0),
  constraint orders_shipping_postal_code_not_blank check (
    char_length(btrim(shipping_postal_code)) > 0
  ),
  constraint orders_shipping_method_not_blank check (char_length(btrim(shipping_method)) > 0),
  constraint orders_payment_method_valid check (
    payment_method in ('simulated_card', 'simulated_transfer')
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint order_items_product_name_not_blank check (char_length(btrim(product_name)) > 0),
  constraint order_items_unit_price_non_negative check (unit_price >= 0),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_line_total_non_negative check (line_total >= 0),
  constraint order_items_line_total_matches check (line_total = unit_price * quantity)
);

create index products_category_id_idx on public.products (category_id);
create index products_price_idx on public.products (price);
create index products_active_category_price_idx
  on public.products (category_id, price)
  where active;
create index carts_user_id_idx on public.carts (user_id);
create unique index carts_one_active_per_user_idx
  on public.carts (user_id)
  where status = 'active';
create index carts_coupon_id_idx on public.carts (coupon_id);
create index cart_items_product_id_idx on public.cart_items (product_id);
create index orders_user_created_at_idx on public.orders (user_id, created_at desc);
create index orders_created_at_idx on public.orders (created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger coupons_set_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
