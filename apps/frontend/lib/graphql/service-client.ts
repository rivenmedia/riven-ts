import { registerApolloClient } from "@apollo/client-integration-nextjs";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

import { createClient } from "./create-client.ts";

function readApiKey() {
  if (!privateEnvironment.BACKEND_API_KEY) {
    throw new Error(
      "BACKEND_API_KEY is not set. Set it to the value of Riven's RIVEN_SETTING__apiKey.",
    );
  }

  return privateEnvironment.BACKEND_API_KEY;
}

/**
 * Queries Riven with the API key rather than the viewer's session, so `"use cache"` scopes can share the result.
 *
 * The API key bypasses role checks, so only use this for data that every signed-in user may read.
 */
export const { query } = registerApolloClient(() => createClient(readApiKey));
