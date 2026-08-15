# MercadoBugs architecture

## Local development topology

```text
React + Vite (http://127.0.0.1:5173)
                |
                | @supabase/supabase-js
                | publishable key
                v
Supabase local API (http://127.0.0.1:54321)
                |
                +-- Auth
                +-- Data API
                +-- Storage
                +-- Realtime
                +-- Edge Runtime
                |
                v
PostgreSQL local (127.0.0.1:54322)
```

The browser communicates only with the Supabase API. It never connects directly to PostgreSQL.
The frontend receives the local URL and publishable key through Vite environment variables.
Secret and service-role keys are backend-only credentials and must never use the `VITE_` prefix.

Supabase CLI owns the local Docker containers and recreates them from `supabase/config.toml`,
versioned migrations, and `supabase/seed.sql`. No hosted Supabase project is connected in Phase 2.

## Current boundaries

Phase 2 contains the infrastructure connection only. It intentionally defines no application
tables, authentication flows, Row Level Security policies, or business Edge Functions.
