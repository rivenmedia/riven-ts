import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import plugin from "../../index.ts";

const hook = plugin.hooks["riven.media-item.download.success"]!;

it("updates library sections for each media entry", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  const refreshCalls: string[] = [];

  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            {
              key: "1",
              type: "movie",
              language: "en",
              uuid: "uuid-1",
              Location: [{ path: "plex-library-path/movies" }],
            },
          ],
        },
      }),
    ),
    http.post("**/library/sections/1/refresh", () => {
      refreshCalls.push("1");

      return HttpResponse.json({});
    }),
  );

  const item = {
    id: "item-1",
    fullTitle: "Test Movie",
    getMediaEntries: vi
      .fn()
      .mockResolvedValue([
        { baseDirectory: "", path: "movies/Test Movie/file.mkv" },
      ]),
  };

  await hook({
    dataSources: dataSourceMap,
    event: { item },
    settings,
    logger,
  } as any);

  expect(refreshCalls).toHaveLength(1);
});

it("throws when no media entries exist", async ({
  dataSourceMap,
  settings,
  logger,
}) => {
  const item = {
    id: "item-2",
    fullTitle: "Empty Movie",
    getMediaEntries: vi.fn().mockResolvedValue([]),
  };

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: { item },
      settings,
      logger,
    } as any),
  ).rejects.toThrow(/No media filesystem entry found/);
});

it("throws when library section update fails", async ({
  server,
  dataSourceMap,
  settings,
  logger,
}) => {
  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            {
              key: "1",
              type: "movie",
              language: "en",
              uuid: "uuid-1",
              Location: [{ path: "plex-library-path/other" }],
            },
          ],
        },
      }),
    ),
  );

  const item = {
    id: "item-3",
    fullTitle: "Fail Movie",
    getMediaEntries: vi
      .fn()
      .mockResolvedValue([
        { baseDirectory: "", path: "movies/Fail Movie/file.mkv" },
      ]),
  };

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: { item },
      settings,
      logger,
    } as any),
  ).rejects.toThrow(/Failed to update library sections/);
});
