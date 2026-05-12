# apps/dashboard — Architecture & Agent Brief

A SvelteKit dev/admin dashboard for riven-ts. Consumes the existing Apollo GraphQL surface from `apps/riven` over HTTP.

## Why this exists

riven-ts has no frontend yet (rearchitecture in progress; old riven-frontend is being deprecated). This is a focused dev/admin tool — not the consumer media UI — so the scope stays tight:

1. Library browser (movies/shows/seasons/episodes from the existing resolvers).
2. Job-queue monitor (BullMQ) — complements bull-board with riven-specific context.
3. Plugin health & status.
4. System overview (bootstrap state, GraphQL health, counters).

## Stack (committed)

- **SvelteKit 5** with Svelte 5 runes (`$state`, `$derived`, `$props`).
- **adapter-node** so it can be containerised next to apps/riven.
- **TypeScript strict**, `verbatimModuleSyntax`.
- **Tailwind v4** via `@tailwindcss/vite`.
- **bits-ui** + **shadcn-svelte** for primitives (matches riven-frontend conventions).
- **Apollo Client 4** as the GraphQL client (matches the server stack — same fragment masking, same scalar handling). No svelte-specific wrapper; use the client directly in `+page.server.ts` load functions and call from `+page.svelte` with `$state` reactivity for client-driven refreshes.
- **graphql-codegen** with `near-operation-file` preset (matches `apps/riven/graphql-codegen.ts` exactly so generated types are interoperable).
- **lucide-svelte** for icons. (Note: the newer official package is `@lucide/svelte`. We're on `lucide-svelte` for now to stay compatible with the in-flight agent writes — flag for an integration-time switch if Brandon prefers parity with riven-frontend.)

## Open contribution points (for Brandon to weigh in)

These choices are reasonable defaults but the user may want to revisit:

1. **GraphQL client choice.** Apollo Client is the conservative match for the server, but Svelte has better-fit options: `@urql/svelte` (official integration, lighter), `houdini` (svelte-native compiler, more opinionated). Switching is a ~1-day swap. _Decision point in `src/lib/graphql/client.ts`._
2. **Auth.** Currently assumes localhost dev (no auth). Production deploy needs a strategy: shared bearer token, Better-Auth (matches riven-frontend), or trust the surrounding network. _Decision point in `src/lib/graphql/client.ts` link headers._
3. **Realtime.** BullMQ queue stats refresh via polling for now. Could move to GraphQL subscriptions if riven-ts adds them, or use the existing `sendEvent` mechanism. _Decision point in `src/routes/queue/+page.ts`._
4. **Dashboard scope creep.** Should this become the public Riven UI eventually, or stay a dev tool? Big architectural implications. _Decision worth discussing with maintainers._

## Repository layout

```
apps/dashboard/
├── package.json            # workspace package, all deps front-loaded
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
├── eslint.config.ts
├── components.json         # shadcn-svelte config
├── turbo.jsonc             # extends root, adds build/codegen/dev tasks
├── graphql-codegen.ts      # owned by Agent B
├── schema.graphql          # generated, gitignored
├── scripts/
│   └── fetch-schema.ts     # owned by Agent B
├── src/
│   ├── app.html
│   ├── app.css             # imports tailwindcss + tokens.css
│   ├── app.d.ts
│   ├── lib/
│   │   ├── utils.ts        # cn() helper (already in place)
│   │   ├── theme/
│   │   │   └── tokens.css  # owned by Agent C
│   │   ├── components/
│   │   │   ├── ui/         # owned by Agent C - shadcn primitives
│   │   │   └── layout/     # owned by Agent C - sidebar, topbar
│   │   └── graphql/        # owned by Agent B
│   │       ├── client.ts
│   │       ├── operations/ # .graphql files contributed by D, E
│   │       └── __generated__/  # codegen output, gitignored
│   └── routes/
│       ├── +layout.svelte  # shell (in place; Agent C wires sidebar/topbar)
│       ├── +page.svelte    # overview (Agent D)
│       ├── library/        # owned by Agent D
│       ├── queue/          # owned by Agent E
│       └── plugins/        # owned by Agent E
└── static/
```

## File ownership boundaries (strict)

Agents must NOT edit files outside their ownership list. Cross-agent communication happens via well-known import paths (documented below).

### Agent B — GraphQL infrastructure

**Owns (creates / edits):**

- `apps/dashboard/scripts/fetch-schema.ts`
- `apps/dashboard/graphql-codegen.ts`
- `apps/dashboard/src/lib/graphql/client.ts`
- `apps/dashboard/src/lib/graphql/index.ts`
- `apps/dashboard/src/lib/graphql/__generated__/**` (codegen output)
- May add operation `.graphql` files under `src/lib/graphql/operations/` as examples; agents D/E may add their own there too.

**Does NOT touch:** `src/routes/**`, `src/lib/components/**`, `src/app.css`, `package.json`.

**Public contract (other agents depend on this):**

- `import { client } from "$lib/graphql/client"` — returns an `ApolloClient` instance configured to talk to `PUBLIC_RIVEN_GRAPHQL_URL`.
- `import { graphql } from "$lib/graphql"` — re-export of `gql` / `TypedDocumentNode` from `@apollo/client`.
- Codegen emits `*.typegen.ts` next to each `*.graphql` (matches apps/riven config). Agents D/E import generated types from there.

### Agent C — UI kit + theme + layout shell

**Owns:**

- `apps/dashboard/src/lib/theme/tokens.css` (replace placeholder values with canonical shadcn-svelte neutral set)
- `apps/dashboard/src/lib/components/ui/**` (create primitives by running `pnpm dlx shadcn-svelte@latest add <name>` for: button, card, badge, table, skeleton, sheet, separator, scroll-area, sonner)
- `apps/dashboard/src/lib/components/layout/sidebar.svelte`
- `apps/dashboard/src/lib/components/layout/topbar.svelte`
- `apps/dashboard/src/lib/components/layout/theme-toggle.svelte`
- `apps/dashboard/src/routes/+layout.svelte` (replace placeholder with `{ sidebar | <main>{@render children?.()}</main> }` shell)

**Does NOT touch:** `src/routes/library/**`, `src/routes/queue/**`, `src/routes/plugins/**`, `src/routes/+page.svelte`, `src/lib/graphql/**`.

**Public contract:**

- All shadcn primitives exported from `$lib/components/ui/<name>/index.ts` (default shadcn-svelte pattern).
- Sidebar nav items: Overview (`/`), Library (`/library`), Queue (`/queue`), Plugins (`/plugins`).
- Dark mode toggled by adding/removing `dark` class on `<html>`. Default is dark.

### Agent D — Overview + Library

**Owns:**

- `apps/dashboard/src/routes/+page.svelte` (overview cards — total movies, shows, queue depth, plugin count)
- `apps/dashboard/src/routes/+page.ts` (load function)
- `apps/dashboard/src/routes/library/+page.svelte`
- `apps/dashboard/src/routes/library/+page.ts`
- `apps/dashboard/src/routes/library/[id]/+page.svelte`
- `apps/dashboard/src/routes/library/[id]/+page.ts`
- `apps/dashboard/src/lib/graphql/operations/library.graphql` (own queries)

**Does NOT touch:** anything else.

**Imports:**

- `import { client } from "$lib/graphql/client"`
- `import { Button, Card, Table, Skeleton, Badge } from "$lib/components/ui"` (use folder imports per agent C's convention)

### Agent E — Queue + Plugins

**Owns:**

- `apps/dashboard/src/routes/queue/+page.svelte`
- `apps/dashboard/src/routes/queue/+page.ts`
- `apps/dashboard/src/routes/plugins/+page.svelte`
- `apps/dashboard/src/routes/plugins/+page.ts`
- `apps/dashboard/src/lib/graphql/operations/queue.graphql`
- `apps/dashboard/src/lib/graphql/operations/plugins.graphql`

**Does NOT touch:** anything else.

**Imports:** same as Agent D.

## GraphQL schema reality

riven-ts uses type-graphql to build the schema at runtime. Resolvers exist for:

- `MediaItem`, `MediaEntry` (base types)
- `Movie`, `Show`, `Season`, `Episode`
- `VfsEntryStat` (filesystem-style entries)

The full schema must be fetched from a running riven instance via introspection. `scripts/fetch-schema.ts` (Agent B) handles that — point it at `RIVEN_SCHEMA_URL` (default `http://localhost:3000`).

The schema for BullMQ queue management and plugin health may not exist yet on the server. Agent E should write the queries assuming reasonable shapes and flag any missing resolvers in their summary; we'll either propose them upstream or stub them in apps/dashboard.

## How to run (post-integration)

```bash
# from repo root
pnpm install                                # picks up new workspace
pnpm --filter @repo/dashboard codegen:schema  # needs a running riven dev instance
pnpm --filter @repo/dashboard codegen:gql
pnpm --filter @repo/dashboard dev           # → http://localhost:4173
```

## Integration checklist (main session)

After agents return:

1. Verify file ownership respected — no agent edited outside their boundaries.
2. Resolve any naming inconsistencies between Agent C's exported component paths and Agents D/E's imports.
3. Confirm `pnpm install` resolves cleanly with the new package.
4. Confirm `pnpm --filter @repo/dashboard check-types` passes (needs codegen).
5. Confirm `pnpm --filter @repo/dashboard dev` boots without errors.
6. Commit on `feat/apps-dashboard` branch (do NOT push without explicit user authorization).
7. Document the contribution points listed above in the session-handoff memory.
