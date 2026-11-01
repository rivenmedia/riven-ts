import { gql } from "@apollo/client";
import { RequestContext } from "@mikro-orm/core";
import { describe, expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type {
  GetEpisodeLookupKeysQuery,
  GetEpisodeLookupKeysQueryVariables,
} from "./episode.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("lookupKeys", () => {
  const GET_EPISODE_LOOKUP_KEYS: TypedDocumentNode<
    GetEpisodeLookupKeysQuery,
    GetEpisodeLookupKeysQueryVariables
  > = gql`
    query GetEpisodeLookupKeys($id: ID!) {
      mediaItemById(id: $id) {
        ... on Episode {
          lookupKeys
        }
      }
    }
  `;

  it("resolves when the episode is the root item of a request", async ({
    orm,
    gqlContext,
    gqlServer,
    season,
    episode,
  }) => {
    // Mirrors the request context created by the GraphQL server's Express middleware
    const { body } = await RequestContext.create(orm.em, async () =>
      gqlServer.executeOperation<
        GetEpisodeLookupKeysQuery,
        GetEpisodeLookupKeysQueryVariables
      >(
        {
          query: GET_EPISODE_LOOKUP_KEYS,
          variables: { id: episode.id },
        },
        { contextValue: gqlContext },
      ),
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.mediaItemById).toMatchObject({
      lookupKeys: [
        `abs:${episode.absoluteNumber.toString()}`,
        `${season.number.toString()}:${episode.number.toString()}`,
      ],
    });
  });
});
