import { gql } from "@apollo/client";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { settings } from "#utilities/settings.ts";

import { initApolloClient } from "./apollo-client.ts";

import type {
  ApiKeyProbeQuery,
  ApiKeyProbeQueryVariables,
} from "./apollo-client.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const API_KEY_PROBE: TypedDocumentNode<
  ApiKeyProbeQuery,
  ApiKeyProbeQueryVariables
> = gql`
  query ApiKeyProbe {
    tmdbIsValid
  }
`;

it("sends the API key as a bearer token", async ({ server }) => {
  const url = new URL("http://riven.test/graphql");
  const authorization = Promise.withResolvers<string | null>();

  server.use(
    graphql.link(url.toString()).query("ApiKeyProbe", ({ request }) => {
      authorization.resolve(request.headers.get("authorization"));

      return HttpResponse.json({ data: { tmdbIsValid: true } });
    }),
  );

  await initApolloClient(url).query({ query: API_KEY_PROBE });

  await expect(authorization.promise).resolves.toBe(
    `Bearer ${settings.apiKey}`,
  );
});
