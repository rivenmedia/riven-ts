import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { describe, expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { pubSub } from "#graphql/pubsub.ts";

const it = baseIt.extend(
  "spyOnPublish",
  () => () => vi.spyOn(pubSub, "publish"),
);

describe("afterTransactionCommit", () => {
  it("publishes a change for each external ID when an item request is created", async ({
    spyOnPublish,
    services,
  }) => {
    const publishSpy = spyOnPublish();
    const { item: itemRequest } =
      await services.itemRequestService.requestMovie({
        imdbId: "tt1234567",
        tmdbId: "123",
      });

    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      "tmdb:123",
      itemRequest.id,
    );
    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      "imdb:tt1234567",
      itemRequest.id,
    );
  });

  it("publishes a change when an item request is updated", async ({
    spyOnPublish,
    em,
    factories: { showItemRequestFactory },
  }) => {
    const itemRequest = await showItemRequestFactory.createOne({
      tvdbId: "456",
      state: "requested",
    });

    const publishSpy = spyOnPublish();

    itemRequest.state = "processing";

    await em.flush();

    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      "tvdb:456",
      itemRequest.id,
    );
  });

  it("publishes a change when an item request's media item is indexed", async ({
    spyOnPublish,
    factories: { movieItemRequestFactory, movieFactory },
  }) => {
    const itemRequest = await movieItemRequestFactory.createOne({
      tmdbId: "321",
      state: "requested",
    });

    const publishSpy = spyOnPublish();

    await movieFactory.createOne({
      itemRequest,
      tmdbId: "321",
      releaseDate: DateTime.utc().minus({ years: 1 }).toJSDate(),
      indexedAt: DateTime.utc().toJSDate(),
    });

    expect(itemRequest.state).toBe("processing");
    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      "tmdb:321",
      itemRequest.id,
    );
  });

  it("publishes a change when an item request is removed", async ({
    spyOnPublish,
    services,
    completedMovieContext: { completedMovie },
  }) => {
    const itemRequest = await completedMovie.itemRequest.loadOrFail();

    const publishSpy = spyOnPublish();

    await services.itemRequestService.removeItemRequest(itemRequest);

    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      `tmdb:${itemRequest.tmdbId ?? ""}`,
      itemRequest.id,
    );
  });

  it("does not publish until the transaction has committed", async ({
    spyOnPublish,
    em,
    factories: { movieItemRequestFactory },
  }) => {
    const publishSpy = spyOnPublish();
    await em.transactional(async (transactionEm) => {
      transactionEm.persist(
        movieItemRequestFactory.makeEntity({ tmdbId: "789" }),
      );

      await transactionEm.flush();

      expect(publishSpy).not.toHaveBeenCalled();
    });

    expect(publishSpy).toHaveBeenCalledWith(
      "ITEM_REQUEST_CHANGED",
      "tmdb:789",
      expect.any(String),
    );
  });

  it("does not publish when the transaction is rolled back", async ({
    spyOnPublish,
    em,
    factories: { movieItemRequestFactory },
  }) => {
    const publishSpy = spyOnPublish();
    await expect(
      em.transactional(async (transactionEm) => {
        transactionEm.persist(
          movieItemRequestFactory.makeEntity({ tmdbId: "789" }),
        );

        await transactionEm.flush();

        throw new Error("Rollback");
      }),
    ).rejects.toThrow("Rollback");

    await expect(
      em.fork().findOne(ItemRequest, { tmdbId: "789" }),
    ).resolves.toBeNull();

    expect(publishSpy).not.toHaveBeenCalled();
  });
});
