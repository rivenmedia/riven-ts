import { ApolloLink, HttpLink } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { SetContextLink } from "@apollo/client/link/context";
import { getSessionCookie } from "better-auth/cookies";
import { cookies } from "next/headers";

import { privateEnvironment } from "#environment/private-environment.schema.ts";
import { isUnavailableCookieStoreError } from "#lib/auth/plugins/next-cookies.ts";

import { cacheOptions } from "./cache-options.ts";

async function readSessionToken() {
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
      cache: new InMemoryCache(cacheOptions),
      link: ApolloLink.from([
        sessionTokenLink,
        new HttpLink({
          uri: `${privateEnvironment.BACKEND_URL}/graphql`,
        }),
      ]),
    }),
);
