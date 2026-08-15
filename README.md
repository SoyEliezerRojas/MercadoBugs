# MercadoBugs

MercadoBugs is a fictitious e-commerce application for software testing practice. Products, payments, addresses, and orders are simulated; no real purchases take place.

## Current status

Phase 5.5 adds the first Internet deployment to the React application, reproducible local Supabase
stack, versioned e-commerce schema, email/password authentication, and complete Row Level Security.
The local development environment remains independent from Supabase Cloud. Catalog and checkout
business features remain intentionally unimplemented until their corresponding phases.

## Architecture

- `web/`: React single-page application built by Vite.
- `web/src/features/`: feature-oriented modules that will grow independently.
- `web/src/components/`: shared interface components.
- `web/src/routes/`: route definitions and route-level pages.
- `supabase/`: reserved for versioned migrations, seed data, and Edge Functions beginning in Phase 2.
- `docs/`: detailed project documentation added incrementally.

The application uses `HashRouter` so direct navigation and browser refreshes work on GitHub Pages without server-side rewrite rules. Production assets are built under `/MercadoBugs/`; this base can be overridden with `VITE_BASE_PATH` during a production build.

Production frontend: `https://soyeliezerrojas.github.io/MercadoBugs/`

## Requirements

- Node.js 20.19+, 22.13+, or 24+
- npm 10+

## Run locally

From the `web` directory:

```bash
npm install
npm run dev
```

Vite will print the local URL, normally `http://localhost:5173`.

## Quality checks

From the `web` directory:

```bash
npm run lint
npm run build
```

The production output is written to `web/dist`.

## Environment variables

Copy the root example file when configuring a fresh checkout:

```powershell
Copy-Item ..\.env.example .env.local
```

Never expose a Supabase `service_role` key or any other secret through a `VITE_` variable.

## Supabase local

### Prerequisites

- Node.js 20 or later.
- Docker Desktop running with Linux containers.
- Root and `web/` dependencies installed with `npm install` in each directory.

The Supabase CLI is pinned as a root development dependency. Use it through the provided npm
scripts or `npx supabase`; a global CLI installation is not required.

### Start the backend

From the repository root:

```powershell
npm install
npm run supabase:start
```

The first start downloads the Docker images. Later starts reuse them. The default local endpoints
are:

- API and Data API: `http://127.0.0.1:54321`
- PostgreSQL: `127.0.0.1:54322` (use the local credentials reported by `supabase status`)
- Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`

Inspect the running services and local credentials from the repository root:

```powershell
npm run supabase:status
npx supabase status -o env
```

Use `PUBLISHABLE_KEY` in `web/.env.local`. Never copy `SECRET_KEY`, `SERVICE_ROLE_KEY`, the JWT
secret, or database credentials into a frontend environment variable.

### Configure the frontend

Create `web/.env.local` from `.env.example` and fill it with the local values reported by
`npx supabase status -o env`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-local-value
```

`web/.env.local` is ignored by Git. Restart Vite after changing an environment variable.

### Run frontend and backend together

Terminal 1, from the repository root:

```powershell
npm run supabase:start
```

Terminal 2, from `web/`:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173`. During development, the browser console prints
`[MercadoBugs] Conexión con Supabase local verificada.` after a harmless SDK request succeeds.

### Stop or reset Supabase

From the repository root:

```powershell
npm run supabase:stop
```

To rebuild the local database from versioned migrations and then run `supabase/seed.sql`:

```powershell
npm run supabase:reset
```

Resetting deletes local database data. It does not affect a hosted Supabase project.

## Production deployment

GitHub Actions builds `web/` with public repository variables and deploys the artifact to GitHub
Pages. Supabase Cloud migrations remain a deliberate manual operation and are never applied by the
frontend workflow. See `docs/deployment.md` for environment setup, release commands, and first-admin
instructions.

## Migration workflow

Create a named migration from the repository root:

```powershell
npx supabase migration new descriptive_change_name
```

The command creates a timestamped SQL file under `supabase/migrations/`. After editing it, use
`npm run supabase:reset` to replay all migrations and the seed from scratch.

## Authentication

Register at `/#/register` and sign in at `/#/login`. Supabase creates a `tester` profile through an
atomic database trigger. Sessions persist across browser refreshes; protected routes return an
unauthenticated visitor to login and preserve the original destination.

RLS is enabled on every current public table. Catalog visibility, row ownership, administrator
access, coupon secrecy, and read-only order history are enforced in PostgreSQL. Admin routes are
also guarded in React for UX. See `docs/authentication.md` for login and first-admin setup, and
`docs/security.md` for the complete access matrix.

## Safety notice

MercadoBugs deliberately contains known defects only after Phase 11. Until then, unexpected behavior should be treated as an accidental implementation defect.
