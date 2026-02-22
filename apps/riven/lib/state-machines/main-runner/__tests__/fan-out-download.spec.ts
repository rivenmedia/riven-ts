import { getEventTypeFromSchema } from "@repo/util-plugin-sdk";
import { Season, Show, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadErrorEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";

import assert from "node:assert";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

const eventType = getEventTypeFromSchema(MediaItemDownloadErrorEvent);

it(`enqueues a scrape for each individual season when a "${eventType}" event is received for a show`, async ({
  actor,
}) => {
  const em = database.em.fork();

  const flowAddSpy = vi.spyOn(flow, "add");

  const show = em.create(Show, {
    contentRating: "tv-14",
    state: "scraped",
    title: "Test Show",
    tvdbId: "1",
    id: 1,
    status: "ended",
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      number: i,
      state: "scraped",
      title: `Season ${i.toString().padStart(2, "0")}`,
      tvdbId: i.toString(),
    });

    show.seasons.add(season);
  }

  const stream = em.create(Stream, {
    infoHash: "1234567890123456789012345678901234567890",
    parsedTitle: "Test Show S01 1080p",
    rank: 0,
    rawTitle: "Test Show S01 1080p",
  });

  show.streams.add(stream);

  await em.flush();

  actor.start();

  actor.send({
    type: "riven.media-item.download.error",
    item: show,
    error: "No valid torrent containers found",
  });

  await vi.waitFor(() => {
    for (const season of show.seasons) {
      expect(flowAddSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "scrape-item",
          data: expect.objectContaining({
            id: season.id,
          }),
        }),
      );
    }
  });
});

it(`enqueues a scrape for each individual season's episode when a "${eventType}" event is received for a season`, async ({
  actor,
}) => {
  const em = database.em.fork();

  const flowAddSpy = vi.spyOn(flow, "add");

  const show = em.create(Show, {
    contentRating: "tv-14",
    state: "scraped",
    title: "Test Show",
    tvdbId: "1",
    id: 1,
    status: "ended",
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      number: i,
      state: "scraped",
      title: `Season ${i.toString().padStart(2, "0")}`,
      tvdbId: i.toString(),
    });

    show.seasons.add(season);
  }

  const stream = em.create(Stream, {
    infoHash: "1234567890123456789012345678901234567890",
    parsedTitle: "Test Show S01 1080p",
    rank: 0,
    rawTitle: "Test Show S01 1080p",
  });

  show.streams.add(stream);

  await em.flush();

  actor.start();

  const failedSeason = show.seasons[2];

  assert(failedSeason);

  actor.send({
    type: "riven.media-item.download.error",
    item: failedSeason,
    error: "No valid torrent containers found",
  });

  await vi.waitFor(() => {
    for (const episode of failedSeason.episodes) {
      expect(flowAddSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: "scrape-item",
          data: expect.objectContaining({
            id: episode.id,
          }),
        }),
      );
    }
  });
});
