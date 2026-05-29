import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

async function makeShowOngoing(em: EntityManager, show: Show) {
  show.status = "continuing";
  await em.flush();
}

it("on reindex success of an ongoing show, enqueues per-episode jobs (not show-level)", async ({
  actor,
  em,
  indexedShowContext: { indexedShow, episodes },
}) => {
  await makeShowOngoing(em, indexedShow);

  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);
  const addBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: indexedShow,
    source: "reindex",
  });

  for (const episode of episodes.filter(
    (e) => e.state === "indexed" || e.state === "scraped",
  )) {
    await vi.waitFor(() => {
      expect(addBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({ id: episode.id }),
            }),
          }),
        ]),
      );
    });
  }

  expect(addBulkSpy).not.toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        queueName: "process-media-item",
        data: expect.objectContaining({
          mediaItem: expect.objectContaining({ id: indexedShow.id }),
        }),
      }),
    ]),
  );

  await vi.waitFor(() => {
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queueName: "process-item-request",
        data: expect.objectContaining({
          itemRequestId: indexedShow.itemRequest.getProperty("id"),
          source: "reindex",
        }),
      }),
    );
  });
});

it("on request-sourced success of an ongoing show, still falls through to existing season fan-out", async ({
  actor,
  em,
  indexedShowContext: { indexedShow },
}) => {
  await makeShowOngoing(em, indexedShow);

  const addBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.index.success",
    item: indexedShow,
    source: "request",
  });

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          queueName: "process-media-item",
        }),
      ]),
    );
  });
});
