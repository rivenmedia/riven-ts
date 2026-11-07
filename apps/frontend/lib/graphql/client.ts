import { ApolloLink, HttpLink } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { SetContextLink } from "@apollo/client/link/context";
import { getSessionCookie } from "better-auth/cookies";
import { cacheTag } from "next/cache";
import { cookies } from "next/headers";

import { privateEnvironment } from "#environment/private-environment.schema.ts";
import { isUnavailableCookieStoreError } from "#lib/auth/plugins/next-cookies.ts";

/**
 * Calling `cookies()` inside `"use cache"` stops Next.js storing the entry, even when the error is caught.
 * `cacheTag()` throws only outside such a scope, so it tells the two apart without touching the request.
 */
function isInCacheScope() {
  try {
    cacheTag();

    return true;
  } catch {
    return false;
  }
}

async function readSessionToken() {
  if (isInCacheScope()) {
    return null;
  }

  try {
    const cookieStore = await cookies();

    return getSessionCookie(new Headers({ cookie: cookieStore.toString() }), {
      cookiePrefix: "riven",
    });
  } catch (error) {
    if (isUnavailableCookieStoreError(error)) {
      return null;
    }

    throw error;
  }
}

const sessionTokenLink = new SetContextLink(
  async ({ headers }: HttpLink.ContextOptions) => {
    const sessionToken = await readSessionToken();

    if (!sessionToken) {
      return {};
    }

    return {
      headers: { ...headers, authorization: `Bearer ${sessionToken}` },
    };
  },
);

export const { getClient, query, PreloadQuery } = registerApolloClient(
  () =>
    new ApolloClient({
      cache: new InMemoryCache({
        possibleTypes: {
          MediaItem: ["Movie", "Show", "Season", "Episode"],
          ShowLikeMediaItem: ["Show", "Season", "Episode"],
        },
        typePolicies: {
          TmdbIndexerData: {
            keyFields: ["type", "id"],
          },
        },
      }),
      link: ApolloLink.from([
        sessionTokenLink,
        new HttpLink({
          uri: `${privateEnvironment.BACKEND_URL}/graphql`,
        }),
      ]),
    }),
);
