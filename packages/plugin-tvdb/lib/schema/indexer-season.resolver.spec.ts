import { expect, vi } from "vitest";

import { it as baseIt } from "../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "../datasource/tvdb.datasource.ts";
import { TvdbIndexerSeasonResolver } from "./indexer-season.resolver.ts";

import type { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";
import type { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

const it = baseIt
  .extend(
    "episode",
    () => (number: number) =>
      ({ id: `episode-${number.toString()}`, number }) as IndexerEpisode,
  )
  .extend(
    "season",
    () => (episodes: IndexerEpisode[]) =>
      ({ rootId: "81189", number: 1, episodes }) as unknown as IndexerSeason,
  );

it("returns the requested episode from a season that includes its episodes", async ({
  episode,
  season,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);
  const getSeason = vi.spyOn(api, "getSeasonInOfficialOrder");

  await expect(
    new TvdbIndexerSeasonResolver().episode(
      season([episode(1), episode(2)]),
      2,
      api,
    ),
  ).resolves.toStrictEqual(episode(2));

  expect(getSeason).not.toHaveBeenCalled();
});

it("loads the season's episodes when the season does not include them", async ({
  episode,
  season,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);
  const getSeason = vi
    .spyOn(api, "getSeasonInOfficialOrder")
    .mockResolvedValue(season([episode(1), episode(3)]));

  await expect(
    new TvdbIndexerSeasonResolver().episode(season([]), 3, api),
  ).resolves.toStrictEqual(episode(3));

  expect(getSeason).toHaveBeenCalledExactlyOnceWith("81189", 1);
});

it("returns null when the season does not have the episode", async ({
  episode,
  season,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);

  vi.spyOn(api, "getSeasonInOfficialOrder").mockResolvedValue(
    season([episode(1)]),
  );

  await expect(
    new TvdbIndexerSeasonResolver().episode(season([]), 5, api),
  ).resolves.toBeNull();
});

it("returns null when TVDB does not have the season", async ({
  season,
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(TvdbAPI);

  vi.spyOn(api, "getSeasonInOfficialOrder").mockResolvedValue(null);

  await expect(
    new TvdbIndexerSeasonResolver().episode(season([]), 1, api),
  ).resolves.toBeNull();
});
