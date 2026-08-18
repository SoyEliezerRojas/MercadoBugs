# Authentication and roles

MercadoBugs uses Supabase Auth with email and password. Anonymous login, phone authentication,
OAuth, magic links, and public admin registration are outside the MVP.

## Data flow

```text
/register
    |
    | supabase.auth.signUp({ email, password, data: { username } })
    v
auth.users
    |
    | on_auth_user_created (atomic database trigger)
    v
public.profiles
    id = auth.users.id
    username = trimmed user metadata
    role = literal 'tester'
```

The trigger never reads a role from user metadata. Even a modified client that submits
`{"role":"admin"}` receives a `tester` profile.

## Username uniqueness

The displayed casing is preserved, but a unique index on `lower(username)` treats `Tester`,
`tester`, and `TESTER` as the same username. A small `is_username_available(text)` RPC returns only
a boolean so registration can show friendly feedback before calling Auth.

The pre-check is not the authority: two simultaneous requests can both observe availability. The
database index resolves that race. Profile creation runs in the same transaction as `auth.users`,
so a trigger failure rolls the Auth insert back and cannot leave an orphan user.

## Sessions and profiles

`AuthProvider` restores the initial Supabase session, subscribes to auth changes, and loads the
current user's profile. Route decisions wait for both session and profile resolution to prevent a
refresh from briefly redirecting an authenticated user to `/login`.

Supabase JS persists and refreshes browser sessions. Logout calls `supabase.auth.signOut()`, clears
the application state, and returns to the home page.

If an Auth user has no profile, the UI keeps the session usable, shows a controlled warning, and
denies admin access. This is an exceptional consistency error that should be investigated in the
database rather than silently inventing a client-side role.

## Route boundaries

- Public: `/`, `/products`, `/products/:id`, `/login`, `/register`, `/forbidden`.
- Authenticated: `/cart`, `/checkout`, `/orders`, `/orders/:id`.
- Admin UX: `/admin`, `/admin/users`, `/admin/bugs`, `/admin/bugs/:code`.

`ProtectedRoute` preserves the attempted location and returns there after login. `AdminRoute`
redirects authenticated non-admin users to `/forbidden`.

React routing is a UX boundary, not the final authorization boundary. Phase 5 enforces profile,
catalog, cart, coupon, and order authorization in PostgreSQL. The complete matrix is documented in
`security.md`.

## Profile security

RLS is enabled on `public.profiles`. Testers can read their own row and update only their own
`username`; admins can read every row and update usernames. Browser roles receive no update
permission on `role`, including admin browser sessions. Promotions remain trusted Studio or SQL
operations. The availability RPC is `SECURITY DEFINER`, has an empty `search_path`, and exposes only
a boolean.

## Email confirmation

Local development uses:

```toml
[auth.email]
enable_confirmations = false
```

This causes signup to return both a user and session immediately. Local passwords must be at least
eight characters through `auth.minimum_password_length = 8`.

For a hosted project, open its Supabase Dashboard, go to **Authentication → Providers → Email**,
turn off **Confirm email**, and save. Do this manually for each hosted environment; local
`config.toml` does not configure Cloud.

## Create the first administrator

1. Register `admin@ejemplo.com` through `/register` with a normal username and password.
2. Confirm it appears in **Authentication → Users** and `public.profiles` with role `tester`.
3. In Studio's Table Editor, open `public.profiles`, locate the username, edit `role` to `admin`, and
   save.
4. Log out, log in again, and open `/#/admin`.

Equivalent SQL in Studio's SQL Editor:

```sql
update public.profiles as p
set role = 'admin'
from auth.users as u
where p.id = u.id
  and lower(u.email) = lower('admin@ejemplo.com')
returning p.id, p.username, p.role;
```

There is deliberately no frontend operation that promotes a user.
