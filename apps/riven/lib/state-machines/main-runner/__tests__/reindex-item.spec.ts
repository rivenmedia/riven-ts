import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { flow } from "../../../message-queue/flows/producer.ts";
import { clearDeduplicationJob } from "../../../message-queue/utilities/clear-deduplication-job.ts";
import * as settingsModule from "../../../utilities/settings.ts";
import { it } from "./helpers/test-context.ts";

it("enqueues a job to reindex the item after the next episode air date if the item is a show", async ({
  em,
  actor,
  seeders: { seedOngoingShow },
  factories: { mediaEntryFactory },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().startOf("minute").toJSDate(),
  });

  const scheduleOffsetMinutes = 30;

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    scheduleOffsetMinutes,
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
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: false,
    },
  });

  actor.start();

  expect.assert(show.nextAirDate, "No next air date found for the seeded show");

  const expectedDelay = DateTime.fromJSDate(show.nextAirDate)
    .plus({ minutes: scheduleOffsetMinutes })
    .diffNow()
    .toMillis();

  await vi.waitFor(
    () => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemRequestId: show.itemRequest.id,
          }),
          opts: expect.objectContaining({
            delay: expectedDelay,
          }),
          queueName: "process-item-request",
        }),
      );
    },
    {
      interval: 0, // Set interval to 0 to prevent fake timers from advancing
    },
  );

  addSpy.mockClear();

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

  // Clear the existing job to ensure the new job is scheduled
  await clearDeduplicationJob(
    "process-item-request",
    `reindex-item-${show.id}`,
  );

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: true,
    },
  });

  expect.assert(show.nextAirDate, "No next air date found for the seeded show");

  const expectedDelayAfterSecondIndexing = DateTime.fromJSDate(show.nextAirDate)
    .plus({ minutes: scheduleOffsetMinutes })
    .diffNow()
    .toMillis();

  await vi.waitFor(
    () => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemRequestId: show.itemRequest.id,
          }),
          opts: expect.objectContaining({
            delay: expectedDelayAfterSecondIndexing,
          }),
          queueName: "process-item-request",
        }),
      );
    },
    {
      interval: 0, // Set interval to 0 to prevent fake timers from advancing
    },
  );
});

it("enqueues a job to reindex the item after unknownAirDateOffsetDays if the item is a show and has no next episode air date", async ({
  em,
  actor,
  seeders: { seedOngoingShow },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().startOf("minute").toJSDate(),
  });

  const unknownAirDateOffsetDays = 7;

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    unknownAirDateOffsetDays,
  });

  const { show } = await seedOngoingShow();

  show.nextAirDate = null; // Remove the next air date to trigger the fallback delay

  await em.flush();

  const addSpy = vi.spyOn(flow, "add");

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: false,
    },
  });

  actor.start();

  const expectedDelay = DateTime.utc()
    .plus({ days: unknownAirDateOffsetDays })
    .diffNow()
    .toMillis();

  await vi.waitFor(
    () => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemRequestId: show.itemRequest.id,
          }),
          opts: expect.objectContaining({
            delay: expectedDelay,
          }),
          queueName: "process-item-request",
        }),
      );
    },
    {
      interval: 0, // Set interval to 0 to prevent fake timers from advancing
    },
  );
});

it("enqueues a job to reindex the item after scheduleOffsetMinutes if the item is a show and the next air date is in the past", async ({
  em,
  actor,
  seeders: { seedOngoingShow },
}) => {
  vi.useFakeTimers({
    now: DateTime.utc().startOf("minute").toJSDate(),
  });

  const scheduleOffsetMinutes = 30;

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    scheduleOffsetMinutes,
  });

  const { show } = await seedOngoingShow();

  show.nextAirDate = DateTime.utc()
    .minus({ days: 1 })
    .startOf("minute")
    .toJSDate(); // Set the next air date in the past to trigger the scheduleOffsetMinutes delay

  await em.flush();

  const addSpy = vi.spyOn(flow, "add");

  actor.send({
    type: "riven.media-item.index.success",
    item: show,
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: false,
    },
  });

  actor.start();

  const expectedDelay = DateTime.utc()
    .plus({ minutes: scheduleOffsetMinutes })
    .diffNow()
    .toMillis();

  await vi.waitFor(
    () => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            itemRequestId: show.itemRequest.id,
          }),
          opts: expect.objectContaining({
            delay: expectedDelay,
          }),
          queueName: "process-item-request",
        }),
      );
    },
    {
      interval: 0, // Set interval to 0 to prevent fake timers from advancing
    },
  );
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
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: false,
    },
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
    meta: {
      type: "show",
      isAdditionalSeasonRequest: false,
      isReindex: false,
    },
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
