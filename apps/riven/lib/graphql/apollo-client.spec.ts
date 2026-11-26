import { gql } from "@apollo/client";
import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";
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
  server.use(
    graphql.link(url.toString()).query("ApiKeyProbe", ({ request }) => {
      if (
        request.headers.get("authorization") !== `Bearer ${settings.apiKey}`
      ) {
        return HttpResponse.json(
          { errors: [{ message: "Unexpected authorization header" }] },
          { status: 401 },
        );
      }

      return HttpResponse.json({ data: { tmdbIsValid: true } });
    }),
  );

  await expect(
    initApolloClient(url).query({ query: API_KEY_PROBE }),
  ).resolves.toMatchObject({ data: { tmdbIsValid: true } });
});
