import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

import type { CacheCheckResponse } from "../schemas/cache-check-response.schema.ts";
import type { ItemStatus } from "../schemas/item-status.schema.ts";

const hash = (index: number) => index.toString(16).padStart(40, "0");

const file = (name: string) => ({ name, path: `/${name}`, size: 100 });

const cacheCheckHandler = (
  statuses: Record<string, ItemStatus>,
  requestedHashes: string[][] = [],
) =>
  http.get("**/v0/store/torz/check", ({ request }) => {
    const hashes =
      new URL(request.url).searchParams.get("hash")?.split(",") ?? [];

    requestedHashes.push(hashes);

    return HttpResponse.json<CacheCheckResponse>({
      data: {
        items: hashes.map((infoHash) => ({
          hash: infoHash,
          status: statuses[infoHash] ?? "unknown",
          files: [file(`${infoHash}.mkv`)],
        })),
      },
    });
  });

it("returns the files of torrents that are cached, downloaded or of unknown status", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const cacheCheckRequestedHook =
    plugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(cacheCheckRequestedHook);

  const statuses = {
    [hash(1)]: "cached",
    [hash(2)]: "downloaded",
    [hash(3)]: "unknown",
    [hash(4)]: "downloading",
    [hash(5)]: "failed",
    [hash(6)]: "invalid",
  } satisfies Record<string, ItemStatus>;

  server.use(cacheCheckHandler(statuses));

  await expect(
    cacheCheckRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHashes: Object.keys(statuses), provider: "realdebrid" },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    [hash(1)]: [file(`${hash(1)}.mkv`)],
    [hash(2)]: [file(`${hash(2)}.mkv`)],
    [hash(3)]: [file(`${hash(3)}.mkv`)],
  });
});

it("checks at most 500 unique torrents per request", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const cacheCheckRequestedHook =
    plugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(cacheCheckRequestedHook);

  const requestedHashes: string[][] = [];
  const uniqueHashes = Array.from({ length: 501 }, (_, index) => hash(index));

  server.use(cacheCheckHandler({}, requestedHashes));

  const result = await cacheCheckRequestedHook({
    dataSources: dataSourceMap,
    event: {
      infoHashes: [...uniqueHashes, hash(0), hash(1)],
      provider: "realdebrid",
    },
    logger,
    settings,
  });

  expect(requestedHashes).toStrictEqual([
    uniqueHashes.slice(0, 500),
    uniqueHashes.slice(500),
  ]);
  expect(Object.keys(result)).toStrictEqual(uniqueHashes);
});

it("does not send an empty request when duplicates fill a chunk", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const cacheCheckRequestedHook =
    plugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(cacheCheckRequestedHook);

  const requestedHashes: string[][] = [];
  const uniqueHashes = Array.from({ length: 500 }, (_, index) => hash(index));

  server.use(cacheCheckHandler({}, requestedHashes));

  await cacheCheckRequestedHook({
    dataSources: dataSourceMap,
    event: { infoHashes: [...uniqueHashes, hash(0)], provider: "realdebrid" },
    logger,
    settings,
  });

  expect(requestedHashes).toStrictEqual([uniqueHashes]);
});

it("keeps the cache status of each store separate", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const cacheCheckRequestedHook =
    plugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(cacheCheckRequestedHook);

  server.use(
    http.get("**/v0/store/torz/check", ({ request }) =>
      HttpResponse.json<CacheCheckResponse>({
        data: {
          items: [
            {
              hash: hash(1),
              status:
                request.headers.get("x-stremthru-store-name") === "realdebrid"
                  ? "cached"
                  : "failed",
              files: [],
            },
          ],
        },
      }),
    ),
  );

  const checkStore = async (provider: string) =>
    cacheCheckRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHashes: [hash(1)], provider },
      logger,
      settings,
    });

  await expect(checkStore("realdebrid")).resolves.toStrictEqual({
    [hash(1)]: [],
  });
  await expect(checkStore("premiumize")).resolves.toStrictEqual({});
});

it("rejects with the reason the cache check failed", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const cacheCheckRequestedHook =
    plugin.hooks["riven.media-item.download.cache-check-requested"];

  expect.assert(cacheCheckRequestedHook);

  server.use(
    http.get("**/v0/store/torz/check", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  await expect(
    cacheCheckRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHashes: [hash(1)], provider: "realdebrid" },
      logger,
      settings,
    }),
  ).rejects.toThrow("Failed to get cache torrent status: 500");
});
