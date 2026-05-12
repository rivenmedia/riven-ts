/**
 * Barrel for the dashboard's GraphQL surface.
 *
 * Route pages / load functions should import everything from here:
 *
 *   import { client, gql, type TypedDocumentNode } from "$lib/graphql";
 *
 * Generated operation types live next to their `.graphql` source as
 * `*.typegen.ts` files (see `graphql-codegen.ts`).
 */
export { client, createClient } from "./client";
export { gql } from "@apollo/client";
export type { TypedDocumentNode } from "@apollo/client";
