# Row Level Security

Phase 5 makes PostgreSQL the authorization boundary for every table exposed through the Supabase
Data API. React route guards still improve navigation, but they do not grant data access.

## Access matrix

`Own` means that the row is linked to `auth.uid()`. `Active` means `active = true`.

| Resource | Anonymous | Tester | Admin |
| --- | --- | --- | --- |
| `profiles` | None | Read own profile; update own `username` | Read all profiles; update any `username` |
| `categories` | Read active rows | Read active rows | Read and manage all rows |
| `products` | Read active rows | Read active rows | Read and manage all rows |
| `carts` | None | Create, read, and delete own carts; coupon/lifecycle via trusted RPC | Read all carts |
| `cart_items` | None | Create, read, update, and delete items in own carts | Read all cart items |
| `coupons` | None | None | Read and manage all coupons |
| `orders` | None | Read own orders | Read all orders |
| `order_items` | None | Read items belonging to own orders | Read all order items |
| `bug_definitions` | None | None | Read all known-bug definitions |

The grants and policies intentionally work together. Grants limit which operations and columns a
browser role may request; RLS then limits which rows qualify.

At the PostgreSQL layer, `authenticated` is the shared role used by both testers and admins. RLS
consults the server-side `profiles.role` only when an operation has an administrative policy; it
does not trust user metadata, local storage, or request payloads.

## Role protection

Browser sessions receive no `UPDATE` privilege on `profiles.role`. This also applies to an admin
browser session because testers and admins both connect to PostgreSQL as `authenticated`. Role
promotion must remain a trusted operation performed in Studio, SQL, or a future server-side admin
workflow. Client code can only update the `username` column, and RLS limits testers to their own
row.

The reusable `private.is_admin()` helper reads the caller's profile. It is `STABLE` and
`SECURITY DEFINER`, uses an empty `search_path`, and lives outside the API-exposed `public` schema.
Only the `authenticated` database role can execute it for policy evaluation; it is not a callable
public RPC.

## Catalog and coupons

Anonymous and authenticated visitors can only select active categories and products. Administrators
can also see inactive entries and manage the catalog.

Coupon rows are completely hidden from anonymous and tester sessions. This prevents clients from
enumerating codes such as the expired `OLD20` seed. Phase 8 validates and attaches one submitted
code through `manage_cart_coupon`; the RPC obtains ownership from `auth.uid()` and never returns the
coupon table.

## Ownership boundaries

Cart-item policies resolve ownership through the parent cart. A caller cannot create an item in,
move an item to, update an item in, or delete an item from another user's cart. Cart updates also
check the resulting owner, which prevents transferring a cart to another user.

Order rows and their snapshots are read-only through browser sessions. Testers can read only their
own history; administrators can read all history. Order creation and stock updates occur only
through the authenticated `perform_checkout` RPC behind the checkout Edge Function. Direct browser
inserts into `orders` and direct tester updates to `products` remain blocked.

## Trusted checkout boundary

The Edge Functions use the publishable/anonymous client configuration with the caller's JWT; they
do not load `service_role`. They call `auth.getUser()` before invoking an authenticated-only RPC.
Both checkout RPCs are `SECURITY DEFINER`, use `search_path = ''`, qualify every relation, reject a
missing `auth.uid()`, and accept no arbitrary owner UUID. Their elevated write access is limited to
the caller's active cart and the products/coupon referenced by that cart.

## Known-bug answers

`bug_definitions` is an answer key rather than public commerce data. `authenticated` receives only
`SELECT`, and the sole policy requires `private.is_admin()`. A tester's direct Data API request
therefore returns zero rows; `anon` lacks even the table privilege. No browser role can insert,
update, or delete definitions in FASE 10, including admin. `AdminRoute` and lazy-loaded pages reduce
accidental exposure in the UX but are not authorization controls.

## Operational rules

- Never expose a `service_role` or secret key in `web/` or in any `VITE_` variable. That role can
  bypass RLS.
- Add RLS and an explicit access decision to every future table before exposing it through the Data
  API.
- Keep ownership columns indexed. The current cart, order, and foreign-key indexes support the
  policy predicates used in this phase.
- The application has no bug-report tables yet; they will receive their own policies when their
  schema is introduced.

The general policies are defined by the Phase 5 migration; the Phase 10 migration owns the
`bug_definitions` policy. Both are recreated by `npm run supabase:reset`.
