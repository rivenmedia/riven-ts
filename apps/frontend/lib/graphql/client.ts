import { registerApolloClient } from "@apollo/client-integration-nextjs";
import { getSessionCookie } from "better-auth/cookies";
import { cookies } from "next/headers";

import { isUnavailableCookieStoreError } from "#lib/utils/is-unavailable-cookie-store-error.ts";

import { createClient } from "./create-client.ts";

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

export const { getClient, query, PreloadQuery } = registerApolloClient(() =>
  createClient(readSessionToken),
);
