import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/subdl.test-context.ts";
import { SubdlAPI } from "./subdl.datasource.ts";

import type { SubtitleSearchResponse } from "../schemas/subtitle-search.response.schema.ts";

const SEARCH_URL = "https://api.subdl.com/api/v1/subtitles";

const createSubtitle = () => ({
  release_name: "The.Matrix.1999.1080p",
  name: "The Matrix",
  lang: "English",
  url: "/subtitle/1.zip",
});

it.for([
  {
    scenario: "a movie by its TMDB ID in the given languages",
    options: {
      type: "movie",
      tmdbId: "603",
      imdbId: "tt0133093",
      languages: ["en", "es"],
    },
    params: [
      ["type", "movie"],
      ["subs_per_page", "30"],
      ["tmdb_id", "603"],
      ["languages", "en,es"],
      ["api_key", "mock-api-key"],
    ],
  },
  {
    scenario: "an episode by its IMDB ID, season and episode",
    options: {
      type: "tv",
      imdbId: "tt0944947",
      seasonNumber: 0,
      episodeNumber: 5,
      languages: [],
    },
    params: [
      ["type", "tv"],
      ["subs_per_page", "30"],
      ["imdb_id", "tt0944947"],
      ["season_number", "0"],
      ["episode_number", "5"],
      ["api_key", "mock-api-key"],
    ],
  },
] as const)(
  "searches for $scenario",
  async ({ options, params }, { server, dataSourceMap }) => {
    const requestedParams: [string, string][][] = [];

    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestedParams.push([...new URL(request.url).searchParams]);

        return HttpResponse.json<SubtitleSearchResponse>({
          status: true,
          subtitles: [createSubtitle()],
        });
      }),
    );

    const results = await dataSourceMap.get(SubdlAPI).searchSubtitles({
      ...options,
      languages: [...options.languages],
    });

    expect(results).toStrictEqual([createSubtitle()]);
    expect(requestedParams).toStrictEqual([params]);
  },
);

it("returns no subtitles when SubDL omits them", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json<SubtitleSearchResponse>({ status: true }),
    ),
  );

  await expect(
    dataSourceMap
      .get(SubdlAPI)
      .searchSubtitles({ type: "movie", tmdbId: "603" }),
  ).resolves.toStrictEqual([]);
});

it("rejects with the error reported by SubDL", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json<SubtitleSearchResponse>({
        status: false,
        error: "Invalid API key",
      }),
    ),
  );

  await expect(
    dataSourceMap
      .get(SubdlAPI)
      .searchSubtitles({ type: "movie", tmdbId: "603" }),
  ).rejects.toThrow("Subtitle search failed: Invalid API key");
});

it("rejects malformed responses", async ({ server, dataSourceMap }) => {
  server.use(http.get(SEARCH_URL, () => HttpResponse.json({ results: [] })));

  await expect(
    dataSourceMap
      .get(SubdlAPI)
      .searchSubtitles({ type: "movie", tmdbId: "603" }),
  ).rejects.toThrow("Invalid response format from SubDL");
});
