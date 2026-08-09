import type { ApolloClient } from "@apollo/client";

/**
 * The narrow slice of `ApolloClient` that the app actually uses. Hooks and
 * components depend on this instead of the full class so tests can pass a
 * lightweight stub instead of standing up a real Apollo Client.
 */
export type GraphqlClient = Pick<ApolloClient, "query">;
