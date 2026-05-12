import type { CodegenConfig } from "@graphql-codegen/cli";
import type { TypeScriptPluginConfig } from "@graphql-codegen/typescript";
import type { TypeScriptDocumentsPluginConfig } from "@graphql-codegen/typescript-operations";

/**
 * Mirrors `apps/riven/graphql-codegen.ts` so generated types stay
 * structurally compatible across the monorepo.
 *
 * Workflow:
 *   1. `pnpm codegen:schema` — fetch SDL from a running riven instance.
 *   2. `pnpm codegen:gql` — emit base types + per-operation .typegen.ts files.
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
    "./src/": {
      preset: "near-operation-file",
      presetConfig: {
        // Path is relative to each generated file's location, so this resolves
        // to src/lib/graphql/__generated__/graphql.ts.
        baseTypesPath: "./lib/graphql/__generated__/graphql.ts",
        extension: ".typegen.ts",
      },
      plugins: ["typescript-operations"],
      config: {
        scalars: {
          ID: "`${string}-${string}-${string}-${string}-${string}`",
          BigInt: "number",
          DateTimeISO: "string",
          JSONObject: "Record<string, unknown>",
        },
        strictScalars: true,
        avoidOptionals: {
          // Use `null` for nullable fields instead of optionals
          field: true,
          // Allow nullable input fields to remain unspecified
          inputValue: false,
        },
        // Apollo Client always includes `__typename` fields
        nonOptionalTypename: true,
        // Apollo Client doesn't add the `__typename` field to root types so
        // don't generate a type for the `__typename` for root operation types.
        skipTypeNameForRoot: true,
        // Use string values for enums (e.g. 'one' | 'two')
        allowEnumStringTypes: true,
        inlineFragmentTypes: "mask",
        customDirectives: {
          apolloUnmask: true,
        },
      } satisfies TypeScriptDocumentsPluginConfig,
    },
  },
} satisfies CodegenConfig;
