import { getEventTypeFromSchema } from "@repo/util-plugin-sdk";
import {
  ItemRequest,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadErrorEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";
import { parse } from "@repo/util-rank-torrent-name";

import { DateTime } from "luxon";
import assert from "node:assert";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

const eventType = getEventTypeFromSchema(MediaItemDownloadErrorEvent);

it(`enqueues a scrape for each incomplete season when a "${eventType}" event is received for a show`, async ({
  actor,
}) => {
  const em = database.em.fork();

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    contentRating: "tv-14",
    title: "Test Show",
    tvdbId: "1",
    id: 1,
    status: "ended",
    itemRequest,
    isRequested: true,
    fullTitle: "Test Show",
    keepUpdated: false,
    releaseDate: DateTime.now().toISO(),
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      number: i,
      title: `Season ${i.toString().padStart(2, "0")}`,
      tvdbId: i.toString(),
      isSpecial: false,
      isRequested: true,
      fullTitle: `${show.fullTitle} - S${i.toString().padStart(2, "0")}`,
      itemRequest,
    });

    show.seasons.add(season);
  }

  const stream = em.create(Stream, {
    infoHash: "1234567890123456789012345678901234567890",
    parsedData: parse("Test Show S01 1080p"),
  });

  show.streams.add(stream);

  await em.flush();

  actor.start();

  actor.send({
    type: "riven.media-item.download.error",
    item: show,
    error: "No valid torrents found",
  });

  await vi.waitFor(() => {
    for (const season of show.seasons) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "scrape-item",
            data: expect.objectContaining({
              id: season.id,
            }),
          }),
        ]),
      );
    }
  });
});

it(`enqueues a scrape for each incomplete episode when a "${eventType}" event is received for a season`, async ({
  actor,
}) => {
  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    contentRating: "tv-14",
    title: "Test Show",
    tvdbId: "1",
    id: 1,
    status: "ended",
    itemRequest,
    isRequested: true,
    fullTitle: "Test Show",
    keepUpdated: false,
    releaseDate: DateTime.now().toISO(),
  });

  await em.flush();

  for (let i = 1; i <= 3; i++) {
    const season = em.create(Season, {
      number: i,
      title: `Season ${i.toString().padStart(2, "0")}`,
      tvdbId: show.tvdbId,
      isSpecial: false,
      isRequested: true,
      fullTitle: `${show.fullTitle} - S${i.toString().padStart(2, "0")}`,
      itemRequest,
      releaseDate: DateTime.now().toISO(),
    });

    show.seasons.add(season);
  }

  const stream = em.create(Stream, {
    infoHash: "1234567890123456789012345678901234567890",
    parsedData: parse("Test Show S01 1080p"),
  });

  show.streams.add(stream);

  await em.flush();

  actor.start();

  const failedSeason = show.seasons[2];

  assert(failedSeason);

  actor.send({
    type: "riven.media-item.download.error",
    item: failedSeason,
    error: "No valid torrents found",
  });

  await vi.waitFor(() => {
    for (const episode of failedSeason.episodes) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "scrape-item",
            data: expect.objectContaining({
              id: episode.id,
            }),
          }),
        ]),
      );
    }
  });
});
