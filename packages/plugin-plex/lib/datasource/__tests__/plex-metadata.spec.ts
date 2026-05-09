import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { PlexMetadataAPI } from "../plex-metadata.datasource.ts";

it("converts plex ID to external IDs with TMDB, TVDB, and IMDB", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(
      "https://metadata.provider.plex.tv/library/metadata/plex-123",
      () =>
        HttpResponse.json({
          MediaContainer: {
            Metadata: [
              {
                type: "movie",
                ratingKey: "plex-123",
                Guid: [
                  { id: "tmdb://456" },
                  { id: "imdb://tt789" },
                  { id: "tvdb://101" },
                ],
              },
            ],
          },
        }),
    ),
  );

  const metadataApi = dataSourceMap.get(PlexMetadataAPI);
  const result = await metadataApi.convertPlexIdToExternalIds("plex-123");

  expect(result).toEqual({
    externalRequestId: "plex-123",
    tmdbId: "456",
    imdbId: "tt789",
    tvdbId: "101",
  });
});

it("returns only externalRequestId when no GUIDs are present", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(
      "https://metadata.provider.plex.tv/library/metadata/plex-no-guids",
      () =>
        HttpResponse.json({
          MediaContainer: {
            Metadata: [
              {
                type: "movie",
                ratingKey: "plex-no-guids",
                Guid: [],
              },
            ],
          },
        }),
    ),
  );

  const metadataApi = dataSourceMap.get(PlexMetadataAPI);
  const result = await metadataApi.convertPlexIdToExternalIds("plex-no-guids");

  expect(result).toEqual({
    externalRequestId: "plex-no-guids",
  });
});

it("handles partial GUID mappings", async ({ server, dataSourceMap }) => {
  server.use(
    http.get(
      "https://metadata.provider.plex.tv/library/metadata/plex-partial",
      () =>
        HttpResponse.json({
          MediaContainer: {
            Metadata: [
              {
                type: "show",
                ratingKey: "plex-partial",
                Guid: [{ id: "tmdb://999" }],
              },
            ],
          },
        }),
    ),
  );

  const metadataApi = dataSourceMap.get(PlexMetadataAPI);
  const result = await metadataApi.convertPlexIdToExternalIds("plex-partial");

  expect(result).toEqual({
    externalRequestId: "plex-partial",
    tmdbId: "999",
    tvdbId: undefined,
    imdbId: undefined,
  });
});
