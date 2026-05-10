import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";

import plugin from "../../index.ts";
import { StremThruSettings } from "../../stremthru-settings.schema.ts";
import { StremThruTorzAPI } from "../stremthru-torz.datasource.ts";

const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(StremThruSettings, {
      realdebridApiKey: "test-rd-key",
    }),
  );

it("addTorrent returns files when status is downloaded", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json({
        data: {
          id: "torrent-1",
          status: "downloaded",
          files: [{ name: "movie.mkv", path: "/movie.mkv", size: 1000 }],
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const result = await api.addTorrent("abc123", "realdebrid");

  expect(result).toEqual({
    torrentId: "torrent-1",
    files: [{ name: "movie.mkv", path: "/movie.mkv", size: 1000 }],
  });
});

it("addTorrent removes torrent and throws when status is not downloaded", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json({
        data: {
          id: "torrent-2",
          status: "downloading",
          files: [],
        },
      }),
    ),
    http.delete("**/v0/store/torz/torrent-2", () =>
      HttpResponse.json({ data: { id: "torrent-2" } }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.addTorrent("abc456", "realdebrid")).rejects.toThrow(
    /was in the downloading state/,
  );
});

it("addTorrent throws when no data is returned", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.post("**/v0/store/torz", () => HttpResponse.json({ data: null })),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.addTorrent("abc789", "realdebrid")).rejects.toThrow(
    /No data returned/,
  );
});

it("removeTorrent calls the delete endpoint", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.delete("**/v0/store/torz/torrent-3", () =>
      HttpResponse.json({ data: { id: "torrent-3" } }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const result = await api.removeTorrent("torrent-3", "realdebrid");

  expect(result).toEqual({ id: "torrent-3" });
});

it("getCachedTorrents returns cached items", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/v0/store/torz/check", () =>
      HttpResponse.json({
        data: {
          items: [
            {
              hash: "a123456789012345678901234567890123456789",
              status: "cached",
              files: [{ name: "file.mkv", path: "/file.mkv", size: 500 }],
            },
            {
              hash: "b123456789012345678901234567890123456789",
              status: "downloading",
              files: [],
            },
            {
              hash: "c123456789012345678901234567890123456789",
              status: "downloaded",
              files: [{ name: "file2.mkv", path: "/file2.mkv", size: 600 }],
            },
          ],
        },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const result = await api.getCachedTorrents(
    [
      "a123456789012345678901234567890123456789",
      "b123456789012345678901234567890123456789",
      "c123456789012345678901234567890123456789",
    ],
    "realdebrid",
  );

  expect(result["a123456789012345678901234567890123456789"]).toEqual([
    { name: "file.mkv", path: "/file.mkv", size: 500 },
  ]);
  expect(result["c123456789012345678901234567890123456789"]).toEqual([
    { name: "file2.mkv", path: "/file2.mkv", size: 600 },
  ]);
  // "downloading" is not in allowed statuses
  expect(result["b123456789012345678901234567890123456789"]).toBeUndefined();
});

it("generateLink returns the link data", async ({ server, dataSourceMap }) => {
  server.use(
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: { link: "https://download.example.com/file.mkv" },
      }),
    ),
  );

  const api = dataSourceMap.get(StremThruTorzAPI);
  const result = await api.generateLink("some-link-id", "realdebrid");

  expect(result).toEqual({ link: "https://download.example.com/file.mkv" });
});

it("addTorrent warns when remove fails for non-downloaded torrent", async ({
  server,
  dataSourceMap,
  logger,
}) => {
  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json({
        data: {
          id: "torrent-fail",
          status: "downloading",
          files: [],
        },
      }),
    ),
    http.delete("**/v0/store/torz/torrent-fail", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const warnSpy = vi.spyOn(logger, "warn");
  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.addTorrent("abc789", "realdebrid")).rejects.toThrow(
    /was in the downloading state/,
  );

  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining("Failed to remove torrent"),
  );
});
