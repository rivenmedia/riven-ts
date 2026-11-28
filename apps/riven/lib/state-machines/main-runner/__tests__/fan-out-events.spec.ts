import { ref } from "@mikro-orm/core";
import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { MediaEntryFactory } from "#database/factories/media-entry.factory.ts";
import { ProcessMediaItemFlow } from "#message-queue/flows/process-media-item/process-media-item.schema.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { it as baseIt } from "./helpers/test-context.ts";

import type { MainRunnerMachineEvent } from "#state-machines/main-runner/index.ts";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

const it = baseIt.extend("spyOnAddBulk", () => () => vi.spyOn(flow, "addBulk"));

it.for<{ type: string; createEvent: (item: Show) => MainRunnerMachineEvent }>([
  {
    type: "riven.media-item.download.partial-success",
    createEvent: (item) => ({
      type: "riven.media-item.download.partial-success",
      item,
      downloader: "@repo/plugin-test",
    }),
  },
  {
    type: "riven.media-item.scrape.error.no-streams-found",
    createEvent: (item) => ({
      type: "riven.media-item.scrape.error.no-streams-found",
      item,
      error: "No streams found",
    }),
  },
])(
  'enqueues each incomplete season of a show after a "$type" event',
  async (
    { createEvent },
    { spyOnAddBulk, actor, em, scrapedShowContext: { scrapedShow, streams } },
  ) => {
    const [completedSeason, ...incompleteSeasons] =
      await scrapedShow.seasons.load();

    expect.assert(completedSeason);
    expect(incompleteSeasons).not.toHaveLength(0);

    const [activeStream] = streams;

    expect.assert(activeStream);

    // A season's state is derived from its episodes' media entries
    for (const episode of await completedSeason.episodes.load()) {
      em.persist(episode);

      episode.activeStream = ref(activeStream);

      episode.filesystemEntries.set([
        new MediaEntryFactory(em).makeEntity({
          mediaItem: episode,
          plugin: "test-plugin",
          provider: "test-provider",
        }),
      ]);
    }

    await em.flush();

    expect(completedSeason.state).toBe("completed");

    const flowAddBulkSpy = spyOnAddBulk();

    actor.start();

    await waitFor(actor, (state) => state.matches("Running"));

    actor.send(createEvent(scrapedShow));

    // Processing the enqueued seasons enqueues further root jobs, so only the fanned-out (non-root) jobs are relevant
    const getFannedOutItemIds = () =>
      flowAddBulkSpy.mock.calls
        .flatMap(([nodes]) => nodes)
        .filter(({ queueName }) => queueName === "process-media-item")
        .map(({ data }) => ProcessMediaItemFlow.shape.input.parse(data))
        .filter(({ isRootItem }) => !isRootItem)
        .map(({ mediaItem }) => mediaItem.id);

    await vi.waitFor(() => {
      expect(getFannedOutItemIds()).toHaveLength(incompleteSeasons.length);
    });

    expect(getFannedOutItemIds()).toStrictEqual(
      expect.arrayContaining(incompleteSeasons.map(({ id }) => id)),
    );
    expect(getFannedOutItemIds()).not.toContain(completedSeason.id);
  },
);
