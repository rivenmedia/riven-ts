import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "../../../__tests__/test-context.ts";

it("returns indexed + requested + non-special-season episodes for a show", async ({
  em,
  services,
  indexedShowContext: { indexedShow, seasons, episodes },
}) => {
  episodes[0].state = "completed";
  episodes[1].state = "failed";
  seasons[0].number = 0;
  await em.flush();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  // 60 total - 2 mutated to non-qualifying states - 10 from special season = 48
  expect(result).toHaveLength(48);
  expect(result.every((item) => item instanceof Episode)).toBe(true);
  expect(result.find((e) => e.id === episodes[0].id)).toBeUndefined();
  expect(result.find((e) => e.id === episodes[1].id)).toBeUndefined();
});

it("includes scraped-state episodes (not just indexed)", async ({
  em,
  services,
  indexedShowContext: { indexedShow, episodes },
}) => {
  episodes[0].state = "scraped";
  await em.flush();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  expect(result.find((e) => e.id === episodes[0].id)).toBeDefined();
});

it("returns an empty array when the show has no missing episodes", async ({
  em,
  services,
  indexedShowContext: { indexedShow, episodes },
}) => {
  for (const ep of episodes) {
    ep.state = "completed";
  }
  await em.flush();

  const result = await services.mediaItemService.getReindexEpisodesToProcess(
    indexedShow.id,
  );

  expect(result).toEqual([]);
});
