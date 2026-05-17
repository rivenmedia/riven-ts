import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { expect, vi } from "vitest";

import { StremThruTorzAPI } from "../../datasource/stremthru-torz.datasource.ts";
import plugin from "../../index.ts";
import { StremThruSettings } from "../../stremthru-settings.schema.ts";

const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(StremThruSettings, {
      realdebridApiKey: "test-rd-key",
      torboxApiKey: "test-tb-key",
    }),
  );

it("download.requested hook calls addTorrent", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  const addTorrentSpy = vi.spyOn(api, "addTorrent").mockResolvedValue({
    files: [],
    downloadUrl: "https://dl.test/file",
  } as any);

  const hook = plugin.hooks["riven.media-item.download.requested"]!;

  await hook({
    dataSources: dataSourceMap,
    event: { infoHash: "abc123", provider: "realdebrid" },
    settings,
    logger: {} as any,
  } as any);

  expect(addTorrentSpy).toHaveBeenCalledWith("abc123", "realdebrid");
});

it("download.requested hook wraps errors", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  vi.spyOn(api, "addTorrent").mockRejectedValue(new Error("Connection failed"));

  const hook = plugin.hooks["riven.media-item.download.requested"]!;

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: { infoHash: "abc123", provider: "realdebrid" },
      settings,
      logger: {} as any,
    } as any),
  ).rejects.toThrow(/Failed to get instant availability from realdebrid/);
});

it("cache-check-requested hook calls getCachedTorrents", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  const spy = vi.spyOn(api, "getCachedTorrents").mockResolvedValue([]);

  const hook = plugin.hooks["riven.media-item.download.cache-check-requested"]!;

  await hook({
    dataSources: dataSourceMap,
    event: { infoHashes: ["hash1", "hash2"], provider: "torbox" },
    settings,
    logger: {} as any,
  } as any);

  expect(spy).toHaveBeenCalledWith(["hash1", "hash2"], "torbox");
});

it("cache-check-requested hook wraps errors", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  vi.spyOn(api, "getCachedTorrents").mockRejectedValue(new Error("Timeout"));

  const hook = plugin.hooks["riven.media-item.download.cache-check-requested"]!;

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: { infoHashes: ["hash1"], provider: "torbox" },
      settings,
      logger: {} as any,
    } as any),
  ).rejects.toThrow(/Failed to get cache torrent status/);
});

it("provider-list-requested hook returns enabled providers", async ({
  dataSourceMap,
  settings,
}) => {
  const hook =
    plugin.hooks["riven.media-item.download.provider-list-requested"]!;

  const result = await hook({
    dataSources: dataSourceMap,
    event: {},
    settings,
    logger: {} as any,
  } as any);

  expect(result.providers).toContain("realdebrid");
  expect(result.providers).toContain("torbox");
  expect(result.providers).toHaveLength(2);
});

it("stream-link.requested hook calls generateLink", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  vi.spyOn(api, "generateLink").mockResolvedValue(
    "https://stream.test/file.mkv",
  );

  const hook = plugin.hooks["riven.media-item.stream-link.requested"]!;

  const result = await hook({
    dataSources: dataSourceMap,
    event: {
      item: {
        downloadUrl: "https://dl.test/file",
        provider: "realdebrid",
      },
    },
    settings,
    logger: {} as any,
  } as any);

  expect(result).toBe("https://stream.test/file.mkv");
});

it("stream-link.requested hook throws when no downloadUrl", async ({
  dataSourceMap,
  settings,
}) => {
  const hook = plugin.hooks["riven.media-item.stream-link.requested"]!;

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: {
        item: { downloadUrl: undefined, provider: "realdebrid" },
      },
      settings,
      logger: {} as any,
    } as any),
  ).rejects.toThrow("No download URL available");
});

it("stream-link.requested hook throws when provider is invalid", async ({
  dataSourceMap,
  settings,
}) => {
  const hook = plugin.hooks["riven.media-item.stream-link.requested"]!;

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: {
        item: { downloadUrl: "https://dl.test/file", provider: "invalid" },
      },
      settings,
      logger: {} as any,
    } as any),
  ).rejects.toThrow();
});

it("stream-link.requested hook wraps generateLink errors", async ({
  dataSourceMap,
  settings,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  vi.spyOn(api, "generateLink").mockRejectedValue(
    new Error("Link generation failed"),
  );

  const hook = plugin.hooks["riven.media-item.stream-link.requested"]!;

  await expect(
    hook({
      dataSources: dataSourceMap,
      event: {
        item: { downloadUrl: "https://dl.test/file", provider: "realdebrid" },
      },
      settings,
      logger: {} as any,
    } as any),
  ).rejects.toThrow(/Failed to generate link from realdebrid/);
});

it("scrape.requested hook calls scrape on torznab API", async ({
  dataSourceMap,
  settings,
}) => {
  const { StremThruTorznabAPI } =
    await import("../../datasource/stremthru-torznab.datasource.ts");
  const api = dataSourceMap.get(StremThruTorznabAPI);
  const scrapeResult = [{ title: "test", infoHash: "abc" }];
  vi.spyOn(api, "scrape").mockResolvedValue(scrapeResult);

  const hook = plugin.hooks["riven.media-item.scrape.requested"]!;
  const event = { item: { id: "item-1" } };

  const result = await hook({
    dataSources: dataSourceMap,
    event,
    settings,
    logger: {} as any,
  } as any);

  expect(result).toEqual({ id: "item-1", results: scrapeResult });
});
