create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all privileges on table
  public.profiles,
  public.categories,
  public.products,
  public.carts,
  public.cart_items,
  public.coupons,
  public.orders,
  public.order_items
from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (username) on table public.profiles to authenticated;

grant select on table public.categories, public.products to anon, authenticated;
grant insert, update, delete on table public.categories, public.products to authenticated;

grant select, delete on table public.carts to authenticated;
grant insert (user_id, status) on table public.carts to authenticated;
grant update (user_id, status) on table public.carts to authenticated;

grant select, insert, update, delete on table public.cart_items to authenticated;

grant select, insert, update, delete on table public.coupons to authenticated;

grant select on table public.orders, public.order_items to authenticated;

create policy profiles_select_admin
on public.profiles
for select
to authenticated
using ((select private.is_admin()));

create policy profiles_update_own_username
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_update_username_admin
on public.profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy categories_select_active
on public.categories
for select
to anon, authenticated
using (active);

create policy categories_select_admin
on public.categories
for select
to authenticated
using ((select private.is_admin()));

create policy categories_insert_admin
on public.categories
for insert
to authenticated
with check ((select private.is_admin()));

create policy categories_update_admin
on public.categories
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy categories_delete_admin
on public.categories
for delete
to authenticated
using ((select private.is_admin()));

create policy products_select_active
on public.products
for select
to anon, authenticated
using (active);

create policy products_select_admin
on public.products
for select
to authenticated
using ((select private.is_admin()));

create policy products_insert_admin
on public.products
for insert
to authenticated
with check ((select private.is_admin()));

create policy products_update_admin
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy products_delete_admin
on public.products
for delete
to authenticated
using ((select private.is_admin()));

create policy carts_select_own
on public.carts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy carts_select_admin
on public.carts
for select
to authenticated
using ((select private.is_admin()));

create policy carts_insert_own
on public.carts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy carts_update_own
on public.carts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy carts_delete_own
on public.carts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy cart_items_select_own
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy cart_items_select_admin
on public.cart_items
for select
to authenticated
using ((select private.is_admin()));

create policy cart_items_insert_own
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy cart_items_update_own
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy cart_items_delete_own
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

create policy coupons_select_admin
on public.coupons
for select
to authenticated
using ((select private.is_admin()));

create policy coupons_insert_admin
on public.coupons
for insert
to authenticated
with check ((select private.is_admin()));

create policy coupons_update_admin
on public.coupons
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy coupons_delete_admin
on public.coupons
for delete
to authenticated
using ((select private.is_admin()));

create policy orders_select_own
on public.orders
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy orders_select_admin
on public.orders
for select
to authenticated
using ((select private.is_admin()));

create policy order_items_select_own
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

create policy order_items_select_admin
on public.order_items
for select
to authenticated
using ((select private.is_admin()));
