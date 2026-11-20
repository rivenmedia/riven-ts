import { DateTime } from "luxon";
import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "#message-queue/flows/producer.ts";

import { it } from "./helpers/test-context.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { MockInstance } from "vitest";

const expectProcessMediaItem = (
  addBulkSpy: MockInstance<typeof flow.addBulk>,
  item: MediaItem,
) =>
  vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        queueName: "process-media-item",
        data: expect.objectContaining({
          mediaItem: expect.objectContaining({ id: item.id }),
        }),
      }),
    ]);
  });

const expectReindex = (
  addSpy: MockInstance<typeof flow.add>,
  item: MediaItem,
) =>
  vi.waitFor(() => {
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: "process-item-request",
        data: expect.objectContaining({
          itemRequestId: item.itemRequest.id,
        }),
        opts: expect.objectContaining({
          deduplication: expect.objectContaining({
            id: `reindex-item-${item.id}`,
          }),
        }),
      }),
    );
  });

it("processes a released movie without scheduling a reindex", async ({
  em,
  actor,
  services,
  indexedMovieContext: { indexedMovie },
}) => {
  indexedMovie.releaseDate = DateTime.utc().minus({ days: 1 }).toJSDate();

  await em.flush();

  const calculateReindexTimeSpy = vi.spyOn(
    services.indexerService,
    "calculateReindexTime",
  );
  const addBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: indexedMovie,
    meta: { type: "movie", isReindex: false },
  });

  await expectProcessMediaItem(addBulkSpy, indexedMovie);

  // Scheduling a reindex calculates the reindex time before any job is added
  expect(calculateReindexTimeSpy).not.toHaveBeenCalled();
});

it("processes a movie without a release date and schedules a reindex", async ({
  em,
  actor,
  indexedMovieContext: { indexedMovie },
}) => {
  indexedMovie.releaseDate = null;

  await em.flush();

  const addSpy = vi.spyOn(flow, "add");
  const addBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: indexedMovie,
    meta: { type: "movie", isReindex: false },
  });

  await expectProcessMediaItem(addBulkSpy, indexedMovie);
  await expectReindex(addSpy, indexedMovie);
});

it("schedules a reindex for an unreleased movie without processing it", async ({
  actor,
  services,
  seeders: { seedUnreleasedMovie },
}) => {
  const { movie } = await seedUnreleasedMovie();

  expect(movie.state).toBe("unreleased");

  const addSpy = vi.spyOn(flow, "add");
  const getItemsToProcessSpy = vi.spyOn(
    services.mediaItemService,
    "getItemsToProcess",
  );

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: movie,
    meta: { type: "movie", isReindex: false },
  });

  await expectReindex(addSpy, movie);

  // Processing an item looks up the items to process before any job is added
  expect(getItemsToProcessSpy).not.toHaveBeenCalledWith(movie.id);
});

it("processes an ended show without scheduling a reindex", async ({
  actor,
  services,
  indexedShowContext: { indexedShow },
}) => {
  indexedShow.status = "ended";

  const calculateReindexTimeSpy = vi.spyOn(
    services.indexerService,
    "calculateReindexTime",
  );
  const addBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: indexedShow,
    meta: { type: "show", isAdditionalSeasonRequest: true, isReindex: false },
  });

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ queueName: "process-media-item" }),
      ]),
    );
  });

  // Scheduling a reindex calculates the reindex time before any job is added
  expect(calculateReindexTimeSpy).not.toHaveBeenCalled();
});
