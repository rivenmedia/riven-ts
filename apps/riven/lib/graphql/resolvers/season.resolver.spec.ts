import { gql } from "@apollo/client";
import { describe, expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import type {
  SeasonUpdatedSubscription,
  SeasonUpdatedSubscriptionVariables,
} from "./season.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("seasonUpdated", () => {
  const SEASON_UPDATED: TypedDocumentNode<
    SeasonUpdatedSubscription,
    SeasonUpdatedSubscriptionVariables
  > = gql`
    subscription SeasonUpdated($id: ID!) {
      seasonUpdated(id: $id) {
        id
        state
        completedEpisodeCount
      }
    }
  `;

  it("emits the season when one of its episodes changes state", async ({
    em,
    gqlSubscribe,
    season,
    episode,
    factories: { mediaEntryFactory },
  }) => {
    const { nextEvent } = await gqlSubscribe(SEASON_UPDATED, {
      id: season.id,
    });

    episode.filesystemEntries.add(
      mediaEntryFactory.makeOne({ mediaItem: episode }),
    );

    await em.flush();

    const { data, errors } = await nextEvent;

    expect(errors).toBeUndefined();
    expect(data).toStrictEqual({
      seasonUpdated: {
        id: season.id,
        state: "partially_completed",
        completedEpisodeCount: 1,
      },
    });
  });
});
