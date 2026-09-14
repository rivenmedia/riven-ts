import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";

it('returns the validation status when calling "tmdbIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TmdbIsValid {
          tmdbIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tmdbIsValid"]).toBe(true);
});

it('returns mapped search results when calling "tmdbSearch" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/search/movie", () =>
      HttpResponse.json({
        page: 1,
        results: [
          {
            id: 95_842,
            title: "Silo",
            overview: "An underground silo",
            release_date: "2023-04-28",
            original_language: "en",
            vote_average: 8.1,
          },
        ],
      }),
    ),
    http.get("**/search/tv", () =>
      HttpResponse.json({
        page: 1,
        results: [
          {
            id: 130_392,
            name: "The Night Agent",
            first_air_date: "2023-03-23",
            original_language: "en",
            vote_average: 7.8,
          },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
      query TmdbSearch {
        tmdbSearch(query: "silo") {
          id
          mediaType
          title
          releaseDate
          originalLanguage
          voteAverage
        }
      }
    `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tmdbSearch"]).toMatchObject([
    {
      id: 95_842,
      mediaType: "movie",
      title: "Silo",
      releaseDate: "2023-04-28",
      originalLanguage: "en",
      voteAverage: 8.1,
    },
    {
      id: 130_392,
      mediaType: "show",
      title: "The Night Agent",
      releaseDate: "2023-03-23",
      originalLanguage: "en",
      voteAverage: 7.8,
    },
  ]);
});

it('returns show details when calling "tmdbShowDetails" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/tv/95842", () =>
      HttpResponse.json({
        id: 95_842,
        name: "Silo",
        number_of_seasons: 2,
      }),
    ),
    http.get("**/tv/95842/external_ids", () =>
      HttpResponse.json({ id: 95_842, tvdb_id: 361_755 }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TmdbShowDetails {
          tmdbShowDetails(id: 95842) {
            id
            name
            numberOfSeasons
            tvdbId
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["tmdbShowDetails"]).toMatchObject({
    id: 95_842,
    name: "Silo",
    numberOfSeasons: 2,
    tvdbId: "361755",
  });
});
