/**
 * Apollo Client singleton + factory for the dashboard.
 *
 * AUTH: There is intentionally no auth link configured here. apps/dashboard is
 * currently a localhost-only dev/admin tool consuming the apps/riven Apollo
 * server, which itself has no auth surface. See ARCHITECTURE.md "Open
 * contribution points" — once a production deploy story emerges (shared
 * bearer, Better-Auth, network trust) the auth link belongs in this file as
 * an ApolloLink composed via `ApolloLink.from([...])`.
 *
 * SSR: This module is import-safe under Node (adapter-node) and the browser.
 * We rely on `globalThis.fetch` which is native in Node 24, and we avoid any
 * touching of `window`, `document`, or `localStorage` at module load.
 */
import { env as publicEnv } from "$env/dynamic/public";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

/** Sensible default that matches `apps/riven` defaults (gqlHost:gqlPort). */
const DEFAULT_GRAPHQL_URL = "http://localhost:3000/";

/**
 * Resolved at module load. Using `$env/dynamic/public` rather than
 * `$env/static/public` so the dashboard runs without requiring the env var to
 * be set at build time — useful for the bare `pnpm dev` happy path.
 */
const resolvedUri: string =
  publicEnv.PUBLIC_RIVEN_GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL;

function buildClient(uri: string): ApolloClient {
  return new ApolloClient({
    link: new HttpLink({
      uri,
      // Explicit reference keeps SSR happy and documents the dependency.
      fetch: globalThis.fetch,
    }),
    cache: new InMemoryCache({
      // Matches the `possibleTypes` declaration in apps/riven's apollo-client
      // so MediaItem interface fragments round-trip cleanly between server
      // and dashboard.
      possibleTypes: {
        MediaItem: ["Movie", "Show", "Season", "Episode"],
      },
    }),
    // Sensible defaults for an admin/dev tool: cache hits keep the UI snappy,
    // and route loaders explicitly opt into `network-only` when they need
    // fresh data on every refresh.
    defaultOptions: {
      query: { fetchPolicy: "cache-first", errorPolicy: "all" },
      watchQuery: { fetchPolicy: "cache-and-network", errorPolicy: "all" },
      mutate: { errorPolicy: "all" },
    },
  });
}

/**
 * Singleton client used by route loaders and components.
 *
 * For per-request isolation in SSR (avoiding cross-user cache bleed) we'd
 * switch to `createClient()` inside `+page.server.ts` load functions and
 * stash the instance on `event.locals`. Today, with no auth, the singleton
 * is acceptable and simpler.
 */
export const client: ApolloClient = buildClient(resolvedUri);

/**
 * Factory for tests / custom URIs (e.g. pointing at a staging riven, or a
 * mocked server). Each call returns a fresh `ApolloClient` with its own
 * cache — useful for unit tests so state doesn't leak between cases.
 */
export function createClient(uri: string = resolvedUri): ApolloClient {
  return buildClient(uri);
}
