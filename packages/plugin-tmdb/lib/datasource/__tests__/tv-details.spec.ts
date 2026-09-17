import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../tmdb.datasource.ts";

it("returns parsed tv series details", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/tv/95842", () =>
      HttpResponse.json({
        id: 95_842,
        name: "Silo",
        number_of_seasons: 2,
        overview: null,
        seasons: [],
      }),
    ),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const details = await tmdbApi.getTvSeriesDetails("95842");

  expect(details.id).toBe(95_842);
  expect(details.name).toBe("Silo");
  expect(details.number_of_seasons).toBe(2);
});

it("returns undefined season count when it is missing", async ({
  server,
  dataSourceMap,
}) => {
  server.use(http.get("**/tv/95842", () => HttpResponse.json({ id: 95_842 })));

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const details = await tmdbApi.getTvSeriesDetails("95842");

  expect(details.number_of_seasons).toBeUndefined();
});

it("returns the tvdb id from the external ids endpoint", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/tv/95842/external_ids", () =>
      HttpResponse.json({ id: 95_842, tvdb_id: 361_755 }),
    ),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const externalIds = await tmdbApi.getTvSeriesExternalIds("95842");

  expect(externalIds.tvdb_id).toBe(361_755);
});

it("returns no tvdb id when it is not known", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/tv/95842/external_ids", () =>
      HttpResponse.json({ id: 95_842, tvdb_id: null }),
    ),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const externalIds = await tmdbApi.getTvSeriesExternalIds("95842");

  expect(externalIds.tvdb_id).toBeNull();
});
