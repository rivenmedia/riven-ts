import { gql } from "@apollo/client";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import type {
  ItemRequestResolverSpecGetItemRequestByExternalIdsQuery,
  ItemRequestResolverSpecGetItemRequestByExternalIdsQueryVariables,
} from "./item-request-by-external-ids.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_ITEM_REQUEST_BY_EXTERNAL_IDS: TypedDocumentNode<
  ItemRequestResolverSpecGetItemRequestByExternalIdsQuery,
  ItemRequestResolverSpecGetItemRequestByExternalIdsQueryVariables
> = gql`
  query ItemRequestResolverSpecGetItemRequestByExternalIds(
    $imdbId: String
    $tmdbId: String
    $tvdbId: String
  ) {
    itemRequestByExternalIds(
      imdbId: $imdbId
      tmdbId: $tmdbId
      tvdbId: $tvdbId
    ) {
      id
    }
  }
`;

const it = baseIt.extend(
  "getItemRequestByExternalIds",
  ({ gqlContext, gqlServer }) =>
    async (
      variables: ItemRequestResolverSpecGetItemRequestByExternalIdsQueryVariables,
    ) => {
      const { body } = await gqlServer.executeOperation<
        ItemRequestResolverSpecGetItemRequestByExternalIdsQuery,
        ItemRequestResolverSpecGetItemRequestByExternalIdsQueryVariables
      >(
        { query: GET_ITEM_REQUEST_BY_EXTERNAL_IDS, variables },
        { contextValue: gqlContext },
      );

      expect.assert(body.kind === "single");

      return body.singleResult;
    },
);

it("returns the item request matching the TMDB ID", async ({
  completedMovieContext: { completedMovie },
  getItemRequestByExternalIds,
}) => {
  const { data } = await getItemRequestByExternalIds({
    tmdbId: completedMovie.tmdbId,
  });

  expect(data?.itemRequestByExternalIds?.id).toBe(
    completedMovie.itemRequest.id,
  );
});

it("returns the item request matching the TVDB ID", async ({
  completedShowContext: { completedShow },
  getItemRequestByExternalIds,
}) => {
  const { data } = await getItemRequestByExternalIds({
    tvdbId: completedShow.tvdbId,
  });

  expect(data?.itemRequestByExternalIds?.id).toBe(completedShow.itemRequest.id);
});

it("returns the item request matching the IMDB ID", async ({
  em,
  completedMovieContext: { completedMovie },
  getItemRequestByExternalIds,
}) => {
  const itemRequest = completedMovie.itemRequest.getEntity();

  em.persist(itemRequest).assign(itemRequest, { imdbId: "tt1234567" });

  await em.flush();

  const { data } = await getItemRequestByExternalIds({ imdbId: "tt1234567" });

  expect(data?.itemRequestByExternalIds?.id).toBe(itemRequest.id);
});

it("returns null when no item request matches", async ({
  getItemRequestByExternalIds,
}) => {
  const { data, errors } = await getItemRequestByExternalIds({
    tmdbId: "0",
  });

  expect(errors).toBeUndefined();
  expect(data?.itemRequestByExternalIds).toBeNull();
});

it("returns an error when no external IDs are provided", async ({
  getItemRequestByExternalIds,
}) => {
  const { errors } = await getItemRequestByExternalIds({});

  expect(errors?.[0]?.message).toBe(
    "At least one external ID must be provided",
  );
});
