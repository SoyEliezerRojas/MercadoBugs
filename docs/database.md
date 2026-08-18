# Database model

Phase 3 defines the correct base e-commerce model. Phase 4 adds authentication automation, Phase 5
adds RLS to every current public table, Phase 8 adds transactional checkout, Phase 10 adds the
administrative known-bug catalog, and Phase 11 enables its five controlled behaviors.

## Relationships

```text
auth.users
    |
    v
profiles
    |-- carts ------ cart_items ------ products ------ categories
    |      |
    |      +-------- coupons
    |
    +-- orders ----- order_items ----- products (nullable reference)

bug_definitions (administrative, no commerce relationship)
```

## Identifier strategy

Every table uses a UUID primary key. `profiles.id` is also a foreign key to `auth.users.id`; all
commercial entities use `gen_random_uuid()` defaults. A single strategy keeps client and Edge
Function payloads consistent and avoids exposing predictable sequential identifiers.

## Tables

### `profiles`

Stores application-specific identity data while Supabase Auth remains the source of authentication.
Usernames are unique, 3–20 characters, and limited to letters, numbers, and `_`. Roles are limited
to `tester` and `admin`. Deleting an Auth user deletes its profile.

Phase 4 adds an atomic `auth.users` trigger that creates this row with the literal role `tester`.
Username uniqueness is enforced case-insensitively through `lower(username)`.

### `categories` and `products`

Products belong to one category. Categories referenced by products and products referenced by an
active cart cannot be deleted accidentally (`ON DELETE RESTRICT`). Slugs are unique. Prices use
`numeric(12,2)`, never floating point, and both price and stock must be non-negative.

The `stock >= 0` constraint remains active. BUG-002 permits the sale but clamps the resulting stock
to zero, so the functional defect does not weaken this integrity rule.

### `coupons`

Codes are uppercase and unique. The type is either `percentage` or `fixed`; values must be positive,
percentage values cannot exceed 100, minimum purchase cannot be negative, and an expiry must occur
after its start when both exist. Expiration itself is evaluated by checkout logic later.

`OLD20` remains enabled and has an `expires_at` value in 2024. BUG-001 intentionally omits only the
expiration rejection; `active`, `starts_at`, minimum, type, and value remain validated.

### `carts` and `cart_items`

A partial unique index guarantees at most one `active` cart per user while retaining converted and
abandoned carts. Deleting a profile deletes its carts, and deleting a cart deletes its items.
Deleting a coupon only removes it from active carts.

`cart_items` stores quantity, not price. A cart displays the current catalog price; checkout later
re-reads authoritative prices server-side. `(cart_id, product_id)` is unique, so quantity changes
update one row rather than creating duplicates.

### `orders` and `order_items`

Orders preserve financial and shipping snapshots. Totals must satisfy:

```text
total = subtotal - discount + shipping_cost
```

No card number, CVV, or real payment token is stored. Payment methods are limited to
`simulated_card` and `simulated_transfer`.

Phase 8 restricts shipping to `standard` or `express` and adds a globally unique, required
`checkout_request_id` UUID. The value makes retries idempotent without exposing sequential order
identifiers. Shipping fields also receive explicit length bounds.

`order_items` snapshots `product_name`, `unit_price`, quantity, and line total. Its product reference
uses `ON DELETE SET NULL`, so deleting a catalog product cannot destroy or alter historical order
details. Deleting an Auth user similarly nulls `orders.user_id` through profile deletion while the
order remains available for administrative history.

### `bug_definitions`

Stores five versioned laboratory definitions with human code, full reproduction information,
severity, category, and lifecycle status. Codes are unique and match `BUG-NNN`; severity is limited
to `low|medium|high|critical`, category to the five Phase 10 domains, and status to
`planned|enabled|disabled`. All text fields must be nonblank. The records live in migrations rather
than the commercial seed: FASE 10 inserts them as `planned` and FASE 11 enables each one in order.

RLS exposes rows only to authenticated administrators through `private.is_admin()`. The browser has
no mutation grants. See `bugs.md` for definitions and baselines.

## Timestamps

One `public.set_updated_at()` trigger function updates `updated_at` on `profiles`, `categories`,
`products`, `coupons`, `carts`, `cart_items`, `orders`, and `bug_definitions`. Immutable order-item
snapshots only have `created_at`.

## Indexes

- Product category and price indexes support catalog filters.
- A partial `(category_id, price)` index supports the common active-product filter combination.
- Cart user lookup and the partial active-cart uniqueness index support cart retrieval.
- The unique cart-item constraint also indexes the `(cart_id, product_id)` access path.
- `(user_id, created_at desc)` supports per-user order history; a date index supports admin history.
- Foreign-key lookup indexes exist for product references in cart and order items.
- Unique constraints already provide indexes for category/product slugs, usernames, and coupon codes;
duplicate indexes are intentionally omitted.

## Checkout functions

`private.checkout_shipping_cost(text)` is the authoritative shipping rule. The authenticated-only
`public.manage_cart_coupon(...)` RPC prices the caller's active cart and persists or removes its
coupon. `public.perform_checkout(...)` snapshots the active cart, locks items/products/coupon, then
creates order snapshots, adjusts stock, and converts the cart in one transaction. FASE 11 adds the
private `checkout_transitions` coordination table for the bounded BUG-003 duplicate window.

Both public RPCs are narrowly scoped `SECURITY DEFINER` functions with an empty `search_path` and
ownership derived from `auth.uid()`. See `checkout.md` for their lock order, rollback behavior, and
idempotency design.

## Seed data

`supabase/seed.sql` contains seven categories, forty fictional products, and four coupons. It does
not create Auth users, profiles, carts, orders, or admins. Known bugs are structural
laboratory data and are inserted exactly once by their versioned Phase 10 migration.
