import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { gql } from "@apollo/client";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/test-context.ts";

import type {
  BlacklistActiveStreamMutation,
  BlacklistActiveStreamMutationVariables,
} from "./media-item.resolver.spec.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

describe("blacklistActiveStream", () => {
  const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
    BlacklistActiveStreamMutation,
    BlacklistActiveStreamMutationVariables
  > = gql`
    mutation BlacklistActiveStream($mediaItemId: ID!) {
      blacklistActiveStream(mediaItemId: $mediaItemId)
    }
  `;

  it("blacklists the active stream for a media item", async ({
    gqlContext,
    gqlServer,
    completedMovieContext: { completedMovie },
  }) => {
    const { body } = await gqlServer.executeOperation<
      BlacklistActiveStreamMutation,
      BlacklistActiveStreamMutationVariables
    >(
      {
        query: BLACKLIST_ACTIVE_STREAM,
        variables: {
          mediaItemId: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.blacklistActiveStream).toBe(true);
  });

  it("returns true if the request succeeded", async ({
    em,
    gqlContext,
    gqlServer,
    completedMovieContext: { completedMovie },
  }) => {
    expect.assert(completedMovie.activeStream?.infoHash);

    await gqlServer.executeOperation<
      BlacklistActiveStreamMutation,
      BlacklistActiveStreamMutationVariables
    >(
      {
        query: BLACKLIST_ACTIVE_STREAM,
        variables: {
          mediaItemId: completedMovie.id,
        },
      },
      { contextValue: gqlContext },
    );

    await expect(
      em.findOneOrFail(BlacklistedStream, {
        stream: completedMovie.activeStream?.infoHash,
      }),
    ).resolves.toBeInstanceOf(BlacklistedStream);
  });
});
