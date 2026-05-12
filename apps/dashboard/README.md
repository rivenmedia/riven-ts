# @repo/dashboard

Dev/admin dashboard for riven-ts. Browse the media library, monitor BullMQ queues, inspect plugin health.

See `ARCHITECTURE.md` for the design rationale and file-ownership boundaries.

## Quick start

```bash
# from repo root
pnpm install
pnpm --filter @repo/dashboard codegen:schema   # needs a running riven dev instance on $RIVEN_SCHEMA_URL
pnpm --filter @repo/dashboard codegen:gql
pnpm --filter @repo/dashboard dev              # → http://localhost:4173
```

## Environment

Copy `.env.example` to `.env` and adjust:

- `PUBLIC_RIVEN_GRAPHQL_URL` — endpoint the browser hits (default `http://localhost:3000`).
- `RIVEN_SCHEMA_URL` — endpoint the codegen script introspects (usually same).
