import { HttpResponse } from "msw/http";
import { expect } from "vitest";

import { getRequestHandler } from "../__generated__/handlers/getRequestHandler.ts";
import { it } from "../__tests__/seerr.test-context.ts";
import { SeerrAPI } from "./seerr.datasource.ts";

import type { ExtendedMediaRequest } from "../schemas/extended-media-request.schema.ts";
import type { RequestResponse } from "../schemas/request-response.schema.ts";

const requester = (email: string) => ({
  id: 1,
  email,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const respondWith = (body: RequestResponse) =>
  getRequestHandler(() => HttpResponse.json<RequestResponse>(body));

const movieRequest = (
  id: number,
  media: { tmdbId?: number },
  email?: string,
): ExtendedMediaRequest => ({
  id,
  status: 2,
  type: "movie",
  media,
  ...(email && { requestedBy: requester(email) }),
});

const showRequest = (
  id: number,
  media: { id?: number; tmdbId?: number; tvdbId?: number },
  seasonNumbers: number[],
  email?: string,
): ExtendedMediaRequest => ({
  id,
  status: 2,
  type: "tv",
  media,
  seasons: seasonNumbers.map((seasonNumber) => ({
    id: seasonNumber,
    status: 2,
    seasonNumber,
  })),
  ...(email && { requestedBy: requester(email) }),
});

it("maps movie requests to their TMDB ID, request ID and requester", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    respondWith({
      pageInfo: { results: 1 },
      results: [movieRequest(10, { tmdbId: 550 }, "user@example.com")],
    }),
  );

  const content = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(content).toStrictEqual({
    movies: [
      {
        tmdbId: "550",
        externalRequestId: "10",
        requestedBy: "user@example.com",
      },
    ],
    shows: [],
  });
});

it("maps show requests to their IDs, media ID and requested seasons", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    respondWith({
      pageInfo: { results: 1 },
      results: [
        showRequest(
          20,
          { id: 300, tmdbId: 1399, tvdbId: 121_361 },
          [1, 2],
          "user@example.com",
        ),
      ],
    }),
  );

  const content = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(content).toStrictEqual({
    movies: [],
    shows: [
      {
        tmdbId: "1399",
        tvdbId: "121361",
        externalRequestId: "300",
        requestedBy: "user@example.com",
        seasons: [1, 2],
      },
    ],
  });
});

it("uses the request ID for shows without a media ID", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    respondWith({
      pageInfo: { results: 1 },
      results: [showRequest(21, { tvdbId: 121_361 }, [1])],
    }),
  );

  const { shows } = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(shows).toStrictEqual([
    {
      tmdbId: undefined,
      tvdbId: "121361",
      externalRequestId: "21",
      requestedBy: undefined,
      seasons: [1],
    },
  ]);
});

it("combines the seasons of multiple requests for the same show", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    respondWith({
      pageInfo: { results: 3 },
      results: [
        showRequest(30, { id: 400, tvdbId: 81_189 }, [1, 2, 3]),
        showRequest(31, { id: 400, tvdbId: 81_189 }, [3, 4]),
        showRequest(32, { id: 401, tvdbId: 73_762 }, [1]),
      ],
    }),
  );

  const { shows } = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(shows).toStrictEqual([
    expect.objectContaining({ tvdbId: "81189", seasons: [1, 2, 3, 4] }),
    expect.objectContaining({ tvdbId: "73762", seasons: [1] }),
  ]);
});

it("skips requests without the ID needed to identify the item", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    respondWith({
      pageInfo: { results: 4 },
      results: [
        movieRequest(40, {}),
        movieRequest(41, { tmdbId: 603 }),
        showRequest(42, { tmdbId: 1399 }, [1]),
        showRequest(43, { tvdbId: 121_361 }, [1]),
      ],
    }),
  );

  const content = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(
    content.movies.map(({ externalRequestId }) => externalRequestId),
  ).toStrictEqual(["41"]);
  expect(
    content.shows.map(({ externalRequestId }) => externalRequestId),
  ).toStrictEqual(["43"]);
});

it("requests every page with the given filter", async ({
  server,
  dataSourceMap,
}) => {
  const requestedPages: Record<string, string | null>[] = [];
  const allMovies = Array.from({ length: 45 }, (_, index) =>
    movieRequest(index, { tmdbId: index + 1 }),
  );

  server.use(
    getRequestHandler(({ request }) => {
      const params = new URL(request.url).searchParams;
      const take = Number(params.get("take"));
      const skip = Number(params.get("skip"));

      requestedPages.push({
        take: params.get("take"),
        skip: params.get("skip"),
        filter: params.get("filter"),
        sort: params.get("sort"),
      });

      return HttpResponse.json<RequestResponse>({
        pageInfo: { results: allMovies.length },
        results: allMovies.slice(skip, skip + take),
      });
    }),
  );

  const { movies } = await dataSourceMap.get(SeerrAPI).getContent("pending");

  expect(requestedPages).toStrictEqual(
    ["0", "20", "40"].map((skip) => ({
      take: "20",
      skip,
      filter: "pending",
      sort: "added",
    })),
  );
  expect(movies.map(({ tmdbId }) => tmdbId)).toStrictEqual(
    allMovies.map((_, index) => (index + 1).toString()),
  );
});

it("returns no content when there are no requests", async ({
  server,
  dataSourceMap,
}) => {
  let requestCount = 0;

  server.use(
    getRequestHandler(() => {
      requestCount += 1;

      return HttpResponse.json<RequestResponse>({});
    }),
  );

  const content = await dataSourceMap.get(SeerrAPI).getContent("approved");

  expect(content).toStrictEqual({ movies: [], shows: [] });
  expect(requestCount).toBe(1);
});
