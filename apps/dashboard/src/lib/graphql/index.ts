/**
 * Barrel for the dashboard's GraphQL surface.
 *
 * Route pages / load functions should import everything from here:
 *
 *   import { client, gql, type TypedDocumentNode } from "$lib/graphql";
 *
 * Per-operation generated types are currently disabled in
 * `graphql-codegen.ts` to avoid emitting `+page.typegen.ts` files
 * inside `src/routes/` (SvelteKit reserves the `+` prefix). The base
 * schema types still emit to `__generated__/graphql.ts`; load functions
 * type their query results inline today.
 */
export { client, createClient } from "./client";
export { gql } from "@apollo/client";
export type { TypedDocumentNode } from "@apollo/client";
