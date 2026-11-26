import { expect, vi } from "vitest";

import { it as baseIt } from "../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { TvdbTmdbIndexerDataResolver } from "./tmdb-indexer-data.resolver.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";
import type { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

const it = baseIt
  .extend("show", () => ({ id: "81189", type: "show" }) as IndexerData)
  .extend("movie", () => ({ id: "603", type: "movie" }) as IndexerData)
  .extend("seasons", () => [{ number: 1 }, { number: 2 }] as IndexerSeason[]);

it("returns a show's seasons in official order", async ({
  seasons,
  show,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);
  const getSeasons = vi
    .spyOn(api, "getAllSeasonsInOfficialOrder")
    .mockResolvedValue(seasons);

  await expect(
    new TvdbTmdbIndexerDataResolver().seasons(show, api),
  ).resolves.toBe(seasons);

  expect(getSeasons).toHaveBeenCalledExactlyOnceWith("81189");
});

it("returns a single season of a show in official order", async ({
  seasons,
  show,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);
  const getSeason = vi
    .spyOn(api, "getSeasonInOfficialOrder")
    .mockResolvedValue(seasons[1] ?? null);

  await expect(
    new TvdbTmdbIndexerDataResolver().season(show, 2, api),
  ).resolves.toBe(seasons[1]);

  expect(getSeason).toHaveBeenCalledExactlyOnceWith("81189", 2);
});

it("does not resolve seasons for movies", async ({ movie, dataSourceMap }) => {
  const api = dataSourceMap.get(TvdbAPI);
  const getSeasons = vi.spyOn(api, "getAllSeasonsInOfficialOrder");
  const getSeason = vi.spyOn(api, "getSeasonInOfficialOrder");
  const resolver = new TvdbTmdbIndexerDataResolver();

  await expect(resolver.seasons(movie, api)).resolves.toBeNull();
  await expect(resolver.season(movie, 1, api)).resolves.toBeNull();

  expect(getSeasons).not.toHaveBeenCalled();
  expect(getSeason).not.toHaveBeenCalled();
});
