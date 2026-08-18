# Project documentation

Documentation will be expanded alongside the implementation:

- `architecture.md` describes the local frontend-to-Supabase topology.
- `database.md` documents the versioned e-commerce schema and integrity decisions.
- `authentication.md` documents Supabase Auth, profiles, roles, and route boundaries.
- `security.md` documents the RLS access matrix and authorization decisions.
- `deployment.md` documents GitHub Pages, Supabase Cloud, and the manual release workflow.
- `catalog.md` documents the product catalog architecture, filters, queries, and BUG-005 baseline.
- `cart.md` documents persistent cart behavior, stock validation, concurrency, and RLS boundaries.
- `checkout.md` documents coupons, atomic checkout, Phase 11 deviations, concurrency, and rollback.
- `orders.md` documents order history, detail snapshots, ownership, and Phase 9 baselines.
- `bugs.md` documents the protected known-bug catalog and the correct Phase 10 baselines.
- `image-sources.md` records the source, author, and license for every local product photograph.

Keeping these documents phase-aligned prevents them from describing behavior that does not yet exist.
