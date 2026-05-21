import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

it("enqueues an item processor job for each incomplete item request in the database", async ({
  actor,
  em,
  factories: { showItemRequestFactory, movieItemRequestFactory },
}) => {
  const flowSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  const completeItems = [
    showItemRequestFactory.makeEntity({
      imdbId: "tt1234560",
      state: "completed",
    }),
  ];

  const incompleteItems = [
    movieItemRequestFactory.makeEntity({
      imdbId: "tt1234561",
      state: "requested",
    }),
    showItemRequestFactory.makeEntity({
      imdbId: "tt1234562",
      state: "requested",
    }),
    showItemRequestFactory.makeEntity({
      imdbId: "tt1234563",
      state: "failed",
    }),
  ];

  await em
    .getRepository(ItemRequest)
    .insertMany([...completeItems, ...incompleteItems]);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  for (const item of incompleteItems) {
    await vi.waitFor(() => {
      expect(flowSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "process-item-request",
          data: expect.objectContaining({
            itemRequestId: item.id,
          }),
        }),
      );
    });
  }

  for (const item of completeItems) {
    expect(flowSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: "process-item-request",
        data: expect.objectContaining({
          itemRequestId: item.id,
        }),
      }),
    );
  }
});

it('enqueues a media item processor job in the "scrape" step for each incomplete indexed media item', async ({
  actor,
  seeders: { seedIndexedMovie },
}) => {
  const flowSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  const indexedMovies = await seedIndexedMovie(3);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  for (const { movie } of indexedMovies) {
    await vi.waitFor(() => {
      expect(flowSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({
                id: movie.id,
              }),
              step: "scrape",
            }),
          }),
        ]),
      );
    });
  }
});

it('enqueues a media item processor job in the "scrape" step for each partially completed media item', async ({
  actor,
  seeders: { seedPartiallyCompletedShow },
}) => {
  const flowSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  const partiallyCompletedShows = await seedPartiallyCompletedShow(3);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  for (const { show } of partiallyCompletedShows) {
    await vi.waitFor(() => {
      expect(flowSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({
                id: show.id,
              }),
              step: "scrape",
            }),
          }),
        ]),
      );
    });
  }
});

it('enqueues a media item processor job in the "download" step for each incomplete scraped media item', async ({
  actor,
  seeders: { seedScrapedMovie },
}) => {
  const flowSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  const scrapedMovies = await seedScrapedMovie(3);

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  for (const { movie } of scrapedMovies) {
    await vi.waitFor(() => {
      expect(flowSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({
                id: movie.id,
              }),
              step: "download",
            }),
          }),
        ]),
      );
    });
  }
});
