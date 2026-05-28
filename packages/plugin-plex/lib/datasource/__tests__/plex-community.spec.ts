import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { PlexCommunityAPI } from "../plex-community.datasource.ts";

it("returns empty sets when no content lists are provided", async ({
  dataSourceMap,
}) => {
  const communityApi = dataSourceMap.get(PlexCommunityAPI);
  const result = await communityApi.getListItemIds(new Set(), "user-uuid");

  expect(result.movies.size).toBe(0);
  expect(result.shows.size).toBe(0);
});

it("fetches list items and separates movies from shows", async ({
  server,
  dataSourceMap,
}) => {
  let requestCount = 0;

  server.use(
    http.post("https://community.plex.tv/api", () => {
      requestCount++;

      // First request: fetch list metadata (slugs)
      if (requestCount === 1) {
        return HttpResponse.json({
          data: {
            user: {
              customLists: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    id: "list-1",
                    name: "My Movies",
                    slug: "my-movies",
                    itemCount: 2,
                  },
                ],
              },
            },
          },
        });
      }

      // Second request: fetch items with metadataItems
      if (requestCount === 2) {
        return HttpResponse.json({
          data: {
            user: {
              customLists: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    id: "list-1",
                    metadataItems: {
                      pageInfo: { hasNextPage: false, endCursor: null },
                      nodes: [
                        {
                          id: "movie-1",
                          title: "Test Movie",
                          type: "movie",
                          year: 2024,
                          guid: "plex://movie/1",
                        },
                        {
                          id: "show-1",
                          title: "Test Show",
                          type: "show",
                          year: 2024,
                          guid: "plex://show/1",
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        });
      }

      return HttpResponse.json({
        data: {
          user: {
            customLists: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [],
            },
          },
        },
      });
    }),
  );

  const communityApi = dataSourceMap.get(PlexCommunityAPI);
  const result = await communityApi.getListItemIds(
    new Set(["my-movies"]),
    "user-uuid",
  );

  expect(result.movies.has("movie-1")).toBe(true);
  expect(result.shows.has("show-1")).toBe(true);
  expect(result.movies.size).toBe(1);
  expect(result.shows.size).toBe(1);
});

it("deduplicates items within a single call", async ({
  server,
  dataSourceMap,
}) => {
  let requestCount = 0;

  server.use(
    http.post("https://community.plex.tv/api", () => {
      requestCount++;

      if (requestCount === 1) {
        return HttpResponse.json({
          data: {
            user: {
              customLists: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    id: "list-1",
                    name: "List A",
                    slug: "list-a",
                    itemCount: 1,
                  },
                  {
                    id: "list-2",
                    name: "List B",
                    slug: "list-b",
                    itemCount: 1,
                  },
                ],
              },
            },
          },
        });
      }

      // Both lists contain the same movie
      if (requestCount === 2) {
        return HttpResponse.json({
          data: {
            user: {
              customLists: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    id: "list-1",
                    metadataItems: {
                      pageInfo: { hasNextPage: false, endCursor: null },
                      nodes: [
                        {
                          id: "movie-dup",
                          title: "Dup Movie",
                          type: "movie",
                          year: 2024,
                        },
                      ],
                    },
                  },
                  {
                    id: "list-2",
                    metadataItems: {
                      pageInfo: { hasNextPage: false, endCursor: null },
                      nodes: [
                        {
                          id: "movie-dup",
                          title: "Dup Movie",
                          type: "movie",
                          year: 2024,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        });
      }

      return HttpResponse.json({
        data: {
          user: {
            customLists: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [],
            },
          },
        },
      });
    }),
  );

  const communityApi = dataSourceMap.get(PlexCommunityAPI);
  const result = await communityApi.getListItemIds(
    new Set(["list-a", "list-b"]),
    "user-uuid",
  );

  expect(result.movies.size).toBe(1);
  expect(result.movies.has("movie-dup")).toBe(true);
});
