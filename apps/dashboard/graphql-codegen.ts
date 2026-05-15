import type { CodegenConfig } from "@graphql-codegen/cli";
import type { TypeScriptPluginConfig } from "@graphql-codegen/typescript";

/**
 * Mirrors `apps/riven/graphql-codegen.ts` so generated types stay
 * structurally compatible across the monorepo.
 *
 * Workflow:
 *   1. `pnpm codegen:schema` — generate SDL from apps/riven resolvers.
 *   2. `pnpm codegen:gql` — emit base TS types for the schema.
 *
 * The per-operation `near-operation-file` preset is deliberately not
 * enabled: it emits `<basename>.typegen.ts` next to each document, which
 * yields `src/routes/+page.typegen.ts` for every page-level query. From
 * @sveltejs/kit 2.41 onward, `svelte-kit sync` rejects any unknown
 * `+`-prefixed file in `src/routes/`, breaking `check-types`. The
 * dashboard load functions type query results inline today
 * (`client.query<{ ... }>({ query })`), so dropping the per-op output
 * doesn't lose any used types. Re-enable behind a non-`+` output naming
 * scheme (custom preset or relocated `folder`) when the routes adopt
 * generated operation types.
 */
export default {
  schema: "schema.graphql",
  // Pick up .graphql files alongside routes plus any inline `gql` documents
  // declared in .ts / .svelte sources. `.svelte` is included so future inline
  // operations in components get picked up automatically.
  documents: [
    "src/**/*.{graphql,gql,svelte,ts}",
    "!src/lib/graphql/__generated__/**/*",
  ],
  ignoreNoDocuments: true,
  overwrite: true,
  importExtension: ".ts",
  generates: {
    "./src/lib/graphql/__generated__/graphql.ts": {
      plugins: ["typescript"],
      config: {
        enumsAsTypes: true,
      } satisfies TypeScriptPluginConfig,
    },
  },
} satisfies CodegenConfig;
