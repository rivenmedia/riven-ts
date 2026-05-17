import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

it("enqueues every pending media item, not just the first", async ({
  actor,
  factories: { movieFactory },
  em,
}) => {
  // Three indexed movies — pre-fix this loop bailed after the first one.
  const movies = await Promise.all([
    movieFactory.makeOne({ state: "indexed" }),
    movieFactory.makeOne({ state: "indexed" }),
    movieFactory.makeOne({ state: "indexed" }),
  ]);
  await em.persistAndFlush(movies);

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  // `riven-internal.retry-library` is also raised by the machine on entry to
  // Running, but sending it explicitly avoids depending on event ordering.
  actor.send({ type: "riven-internal.retry-library" });

  await vi.waitFor(() => {
    for (const movie of movies) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({ id: movie.id }),
            }),
          }),
        ]),
      );
    }
  });
});

it("requests a scrape for media items in the indexed state", async ({
  actor,
  factories: { movieFactory },
  em,
}) => {
  const movie = await movieFactory.makeOne({ state: "indexed" });
  await em.persistAndFlush(movie);

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({ type: "riven-internal.retry-library" });

  await vi.waitFor(() => {
    expect(flowAddBulkSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          queueName: "process-media-item",
          data: expect.objectContaining({
            step: "scrape",
            mediaItem: expect.objectContaining({ id: movie.id }),
          }),
        }),
      ]),
    );
  });
});

it("requests a download for media items in the scraped state", async ({
  actor,
  factories: { movieFactory },
  em,
}) => {
  const movie = await movieFactory.makeOne({ state: "scraped" });
  await em.persistAndFlush(movie);

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({ type: "riven-internal.retry-library" });

  await vi.waitFor(() => {
    expect(flowAddBulkSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          queueName: "process-media-item",
          data: expect.objectContaining({
            step: "download",
            mediaItem: expect.objectContaining({ id: movie.id }),
          }),
        }),
      ]),
    );
  });
});
