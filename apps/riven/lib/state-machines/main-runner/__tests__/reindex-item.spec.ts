import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

it("enqueues a job to reindex the item after the next episode air date if the item is a show", async ({
  em,
  actor,
  seeders: { seedOngoingShow },
  factories: { mediaEntryFactory },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().toJSDate(),
  });

  const { show, episodes } = await seedOngoingShow();
  const indexedEpisode = episodes?.find(
    (episode) => episode.state === "indexed",
  );

  expect.assert(indexedEpisode, "No indexed episode found for the seeded show");

  const addSpy = vi.spyOn(flow, "add");

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
  });

  actor.start();

  const expectedReindexDelay = 606_599_950;

  await vi.waitFor(() => {
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemRequestId: show.itemRequest.id,
        }),
        opts: expect.objectContaining({
          delay: expectedReindexDelay,
        }),
        queueName: "process-item-request",
      }),
    );
  });

  addSpy.mockClear();

  expect(addSpy).not.toHaveBeenCalled();

  indexedEpisode.filesystemEntries.add(
    mediaEntryFactory.makeOne({
      mediaItem: indexedEpisode,
    }),
  );

  await em.flush();

  const unreleasedEpisode = episodes?.find(
    (episode) => episode.state === "unreleased",
  );

  expect.assert(
    unreleasedEpisode,
    "No unreleased episode found for the seeded show",
  );

  expect.assert(
    unreleasedEpisode.releaseDate,
    "No release date found for the unreleased episode",
  );

  vi.setSystemTime(unreleasedEpisode.releaseDate);

  unreleasedEpisode.year = null; // Trigger a change on the entity to update the state

  await em.flush();

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
  });

  await vi.waitFor(() => {
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemRequestId: show.itemRequest.id,
        }),
        opts: expect.objectContaining({
          delay: expectedReindexDelay,
        }),
        queueName: "process-item-request",
      }),
    );
  });
});

it("enqueues a job to process the latest released episodes if the item is a show", async ({
  em,
  actor,
  seeders: { seedOngoingShow },
  factories: { mediaEntryFactory },
}) => {
  vi.useFakeTimers();

  const { show, episodes } = await seedOngoingShow();
  const indexedEpisode = episodes?.find(
    (episode) => episode.state === "indexed",
  );

  expect.assert(indexedEpisode, "No indexed episode found for the seeded show");

  const addBulkSpy = vi.spyOn(flow, "addBulk");

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
  });

  actor.start();

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          mediaItem: expect.objectContaining({
            id: indexedEpisode.id,
          }),
          isRootItem: true,
        }),
        queueName: "process-media-item",
      }),
    ]);
  });

  indexedEpisode.filesystemEntries.add(
    mediaEntryFactory.makeOne({
      mediaItem: indexedEpisode,
    }),
  );

  await em.flush();

  const unreleasedEpisode = episodes?.find(
    (episode) => episode.state === "unreleased",
  );

  expect.assert(
    unreleasedEpisode,
    "No unreleased episode found for the seeded show",
  );

  expect.assert(
    unreleasedEpisode.releaseDate,
    "No release date found for the unreleased episode",
  );

  vi.setSystemTime(unreleasedEpisode.releaseDate);

  unreleasedEpisode.year = null; // Trigger a change on the entity to update the state

  await em.flush();

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
  });

  await vi.waitFor(() => {
    expect(addBulkSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          mediaItem: expect.objectContaining({
            id: unreleasedEpisode.id,
          }),
          isRootItem: true,
        }),
        queueName: "process-media-item",
      }),
    ]);
  });
});
