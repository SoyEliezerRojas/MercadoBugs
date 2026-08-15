# Deployment

MercadoBugs keeps two independent environments:

| Environment | Frontend | Backend |
| --- | --- | --- |
| Local development | Vite on `http://127.0.0.1:5173` | Supabase CLI and Docker |
| Production | GitHub Pages | Supabase Cloud |

Production endpoints:

- Frontend: `https://soyeliezerrojas.github.io/MercadoBugs/`
- Supabase: `https://eaouxnecjovvypayixff.supabase.co`

## Local development

Start the local backend from the repository root:

```powershell
npm install
npm run supabase:start
```

Create `web/.env.local` from `.env.example` and use the local URL and publishable key reported by
`npx supabase status -o env`. Then start Vite in a second terminal:

```powershell
cd web
npm install
npm run dev
```

Local environment files are ignored by Git. Local development never needs Cloud database
credentials.

## Supabase Cloud

The project reference is `eaouxnecjovvypayixff`. Link the CLI from the repository root without
placing the database password on the command line:

```powershell
npx supabase login
npx supabase link --project-ref eaouxnecjovvypayixff
npx supabase projects list
```

Preview and apply database migrations deliberately:

```powershell
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

`supabase/migrations/` remains the schema source of truth. Do not reproduce schema changes manually
in Table Editor and do not run `supabase db reset --linked` against this project.

The initial catalog seed contains no users or sessions and uses `ON CONFLICT ... DO NOTHING`, so it
does not duplicate or overwrite existing rows. It was loaded for the first deployment with:

```powershell
npx supabase db push --dry-run --include-seed
npx supabase db push --include-seed
```

This is not part of routine production deployment. Future production data changes should be
reviewed explicitly instead of blindly re-running seed data.

## Cloud Auth configuration

In Supabase Dashboard:

- `Authentication -> Sign In / Providers -> Email`: Email and signup enabled; Confirm Email off.
- `Authentication -> URL Configuration`: Site URL set to the production frontend.
- Redirect URLs allow the production URL plus `http://127.0.0.1:5173/**` and
  `http://localhost:5173/**` for development.

## GitHub Pages

The repository requires these public Actions variables under
`Settings -> Secrets and variables -> Actions -> Variables`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

They are intentionally embedded in the browser bundle and are safe only because grants and RLS
enforce access. Never add a database password, Supabase access token, secret key, or `service_role`
key to the frontend workflow.

Pages uses `Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`. The workflow in
`.github/workflows/deploy.yml` runs on pushes to `main` and on manual dispatch:

```text
checkout -> npm ci -> lint -> build -> upload Pages artifact -> deploy Pages
```

The production Vite base is derived from the repository name, yielding `/MercadoBugs/`. HashRouter
keeps route navigation and refreshes compatible with static hosting.

## Future deployments

Frontend-only changes follow this path:

```text
push main -> GitHub Actions -> GitHub Pages
```

Database changes remain manual during the MVP:

```text
create migration -> reset and test locally -> db push --dry-run -> review -> db push
```

Database migrations are deliberately not executed by GitHub Actions.

## First Cloud administrator

Register the account through MercadoBugs first. The Auth trigger creates its profile as `tester`.
Then either edit only the profile's `role` in Table Editor or execute this in SQL Editor:

```sql
update public.profiles as p
set role = 'admin'
from auth.users as u
where p.id = u.id
  and lower(u.email) = lower('admin@ejemplo.com')
returning p.id, p.username, p.role;
```

Log out and back in after the promotion. Never create administrators through seed data or client
metadata.
