import { gql } from "@apollo/client";
import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { pubSub } from "#graphql/pubsub.ts";

import type {
  ItemRequestChangedSubscription,
  ItemRequestChangedSubscriptionVariables,
} from "./item-request-changed.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const ITEM_REQUEST_CHANGED: TypedDocumentNode<
  ItemRequestChangedSubscription,
  ItemRequestChangedSubscriptionVariables
> = gql`
  subscription ItemRequestChanged(
    $tmdbId: String
    $tvdbId: String
    $imdbId: String
  ) {
    itemRequestChanged(tmdbId: $tmdbId, tvdbId: $tvdbId, imdbId: $imdbId)
  }
`;

it("emits the ID of an item request that changes for the given external ID", async ({
  gqlSubscribe,
}) => {
  const itemRequestId = randomUUID();
  const { nextEvent } = await gqlSubscribe(ITEM_REQUEST_CHANGED, {
    tvdbId: "81189",
  });

  pubSub.publish("ITEM_REQUEST_CHANGED", "tvdb:81189", itemRequestId);

  await expect(nextEvent).resolves.toMatchObject({
    data: { itemRequestChanged: itemRequestId },
  });
});

it("listens to the TMDB ID when several external IDs are given", async ({
  gqlSubscribe,
}) => {
  const itemRequestId = randomUUID();
  const { nextEvent } = await gqlSubscribe(ITEM_REQUEST_CHANGED, {
    imdbId: "tt0903747",
    tmdbId: "1396",
  });

  pubSub.publish("ITEM_REQUEST_CHANGED", "imdb:tt0903747", randomUUID());
  pubSub.publish("ITEM_REQUEST_CHANGED", "tmdb:1396", itemRequestId);

  await expect(nextEvent).resolves.toMatchObject({
    data: { itemRequestChanged: itemRequestId },
  });
});

it("rejects a subscription without an external ID", async ({
  gqlSubscribe,
}) => {
  await expect(gqlSubscribe(ITEM_REQUEST_CHANGED, {})).rejects.toThrow(
    "At least one external ID must be provided",
  );
});
