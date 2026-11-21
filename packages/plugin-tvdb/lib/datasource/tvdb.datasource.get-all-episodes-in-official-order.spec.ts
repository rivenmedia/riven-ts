import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { postLoginHandler } from "../__generated__/handlers/postLoginHandler.ts";
import { it } from "../__tests__/tvdb.test-context.ts";
import { TvdbAPI } from "./tvdb.datasource.ts";

const episode = (id: number) => ({
  id,
  seriesId: 81_189,
  seasonNumber: 1,
  number: id,
  name: `Episode ${id.toString()}`,
});

it("collects the episodes from every page", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    postLoginHandler(),
    http.get(
      "https://api4.thetvdb.com/v4/series/81189/episodes/official/eng",
      ({ request }) => {
        const page = new URL(request.url).searchParams.get("page");

        return HttpResponse.json({
          status: "success",
          data: {
            episodes: page === "1" ? [episode(3)] : [episode(1), episode(2)],
          },
          links: {
            next:
              page === "1"
                ? null
                : "https://api4.thetvdb.com/v4/series/81189/episodes/official/eng?page=1",
          },
        });
      },
    ),
  );

  const episodes = await dataSourceMap
    .get(TvdbAPI)
    .getAllEpisodesInOfficialOrder("81189");

  expect(episodes.map(({ id }) => id)).toStrictEqual([1, 2, 3]);
});

it("rejects a series without episodes", async ({ server, dataSourceMap }) => {
  server.use(
    postLoginHandler(),
    http.get(
      "https://api4.thetvdb.com/v4/series/81189/episodes/official/eng",
      () => HttpResponse.json({ status: "success", data: { episodes: [] } }),
    ),
  );

  await expect(
    dataSourceMap.get(TvdbAPI).getAllEpisodesInOfficialOrder("81189"),
  ).rejects.toThrow(
    "Failed to retrieve episodes for series with id 81189: No episodes in response",
  );
});
