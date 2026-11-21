import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { stripVTControlCharacters } from "node:util";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";

import { logShowCompletion } from "./log-show-completion.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

const it = baseIt.extend("infoMessages", () => {
  const infoSpy = vi.spyOn(logger, "info");

  return () =>
    infoSpy.mock.calls.map(([message]) =>
      stripVTControlCharacters(
        typeof message === "string" ? message : JSON.stringify(message),
      ),
    );
});

const loadShow = async (
  em: EntityManager,
  id: UUID,
  changes: Partial<Pick<Show, "status" | "nextAirDate">> = {},
  unrequestSeason = false,
) => {
  const show = await em.findOneOrFail(Show, id);

  em.assign(show, changes);

  if (unrequestSeason) {
    const season = await em.findOneOrFail(
      Season,
      { show: id, isSpecial: false },
      { orderBy: { number: "desc" } },
    );

    season.isRequested = false;
  }

  await em.flush();

  return show;
};

it("does not log completion whilst the show has incomplete items", async ({
  em,
  infoMessages,
  seeders: { seedPartiallyCompletedShow },
  services: { indexerService },
}) => {
  const { show } = await seedPartiallyCompletedShow();

  await logShowCompletion(await loadShow(em, show.id), indexerService);

  expect(infoMessages()).toStrictEqual([]);
});

it("logs that an ended show has been downloaded", async ({
  completedShowContext: { completedShow },
  em,
  infoMessages,
  services: { indexerService },
}) => {
  const show = await loadShow(em, completedShow.id, { status: "ended" });

  await logShowCompletion(show, indexerService);

  expect(infoMessages()).toStrictEqual([
    `${show.fullTitle} successfully downloaded.`,
  ]);
});

it("logs that every requested episode of an ended show has been downloaded", async ({
  completedShowContext: { completedShow },
  em,
  infoMessages,
  services: { indexerService },
}) => {
  const show = await loadShow(em, completedShow.id, { status: "ended" }, true);

  await logShowCompletion(show, indexerService);

  expect(infoMessages()).toStrictEqual([
    `${show.fullTitle} successfully downloaded all requested episodes.`,
  ]);
});

it("logs that every available episode of a continuing show has been downloaded", async ({
  completedShowContext: { completedShow },
  em,
  infoMessages,
  services: { indexerService },
}) => {
  const show = await loadShow(em, completedShow.id, {
    status: "continuing",
    nextAirDate: null,
  });

  await logShowCompletion(show, indexerService);

  expect(infoMessages()).toStrictEqual([
    `${show.fullTitle} downloaded all available episodes.`,
  ]);
});

it("logs when new episodes of a continuing show will be downloaded", async ({
  completedShowContext: { completedShow },
  em,
  infoMessages,
  services: { indexerService },
}) => {
  const show = await loadShow(em, completedShow.id, {
    status: "continuing",
    nextAirDate: DateTime.utc().plus({ days: 7 }).toJSDate(),
  });

  const { reindexTime } = await indexerService.calculateReindexTime(show);

  await logShowCompletion(show, indexerService);

  expect(infoMessages()).toStrictEqual([
    `${show.fullTitle} downloaded all available episodes. New episodes will attempt to be downloaded at ${reindexTime.toLocaleString(DateTime.DATETIME_SHORT)}.`,
  ]);
});

it("logs when new episodes of a partially requested continuing show will be indexed", async ({
  completedShowContext: { completedShow },
  em,
  infoMessages,
  services: { indexerService },
}) => {
  const show = await loadShow(
    em,
    completedShow.id,
    {
      status: "continuing",
      nextAirDate: DateTime.utc().plus({ days: 7 }).toJSDate(),
    },
    true,
  );

  const { reindexTime } = await indexerService.calculateReindexTime(show);

  await logShowCompletion(show, indexerService);

  expect(infoMessages()).toStrictEqual([
    `${show.fullTitle} downloaded all requested episodes. New episodes will be indexed at ${reindexTime.toLocaleString(DateTime.DATETIME_SHORT)}.`,
  ]);
});
