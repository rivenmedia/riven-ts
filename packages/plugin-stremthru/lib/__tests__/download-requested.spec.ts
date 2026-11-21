import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "./stremthru.test-context.ts";

import type { AddTorrentResponse } from "../schemas/add-torrent-response.schema.ts";

const INFO_HASH = "a".repeat(40);

const files = [
  {
    name: "movie.mkv",
    path: "/movie/movie.mkv",
    size: 1000,
    link: "https://cdn/movie.mkv",
  },
];

it("adds the torrent to the store and returns its files", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const downloadRequestedHook =
    plugin.hooks["riven.media-item.download.requested"];

  expect.assert(downloadRequestedHook);

  const requests: {
    body: unknown;
    store: string | null;
    auth: string | null;
  }[] = [];

  server.use(
    http.post("**/v0/store/torz", async ({ request }) => {
      requests.push({
        body: await request.json(),
        store: request.headers.get("x-stremthru-store-name"),
        auth: request.headers.get("x-stremthru-store-authorization"),
      });

      return HttpResponse.json<AddTorrentResponse>({
        data: { id: "torrent-id", files, status: "downloaded" },
      });
    }),
  );

  await expect(
    downloadRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHash: INFO_HASH, provider: "realdebrid" },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({
    success: true,
    data: { torrentId: "torrent-id", files },
  });
  expect(requests).toStrictEqual([
    {
      body: { link: INFO_HASH },
      store: "realdebrid",
      auth: "Bearer test-realdebrid-api-key",
    },
  ]);
});

it.for(["queued", "downloading", "failed"] as const)(
  "removes a torrent that is %s instead of downloading it",
  async (status, { server, plugin, settings, logger, dataSourceMap }) => {
    const downloadRequestedHook =
      plugin.hooks["riven.media-item.download.requested"];

    expect.assert(downloadRequestedHook);

    const removedTorrents: string[] = [];

    server.use(
      http.post("**/v0/store/torz", () =>
        HttpResponse.json<AddTorrentResponse>({
          data: { id: "torrent-id", files: [], status },
        }),
      ),
      http.delete("**/v0/store/torz/:id", ({ params }) => {
        removedTorrents.push(String(params["id"]));

        return HttpResponse.json({ data: { id: "torrent-id" } });
      }),
    );

    await expect(
      downloadRequestedHook({
        dataSources: dataSourceMap,
        event: { infoHash: INFO_HASH, provider: "realdebrid" },
        logger,
        settings,
      }),
    ).rejects.toThrow(
      `Failed to get instant availability for ${INFO_HASH} from realdebrid: ${INFO_HASH} was in the ${status} state on realdebrid; the torrent will not be downloaded.`,
    );
    expect(removedTorrents).toStrictEqual(["torrent-id"]);
  },
);

it("still rejects the torrent when it cannot be removed", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const downloadRequestedHook =
    plugin.hooks["riven.media-item.download.requested"];

  expect.assert(downloadRequestedHook);

  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json<AddTorrentResponse>({
        data: { id: "torrent-id", files: [], status: "queued" },
      }),
    ),
    http.delete("**/v0/store/torz/:id", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  await expect(
    downloadRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHash: INFO_HASH, provider: "realdebrid" },
      logger,
      settings,
    }),
  ).rejects.toThrow(`${INFO_HASH} was in the queued state on realdebrid`);
});

it("returns the status code of an HTTP error from the store", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const downloadRequestedHook =
    plugin.hooks["riven.media-item.download.requested"];

  expect.assert(downloadRequestedHook);

  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json(null, { status: 503 }),
    ),
  );

  await expect(
    downloadRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHash: INFO_HASH, provider: "realdebrid" },
      logger,
      settings,
    }),
  ).resolves.toStrictEqual({ success: false, statusCode: 503 });
});

it("rejects when the store returns no torrent", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const downloadRequestedHook =
    plugin.hooks["riven.media-item.download.requested"];

  expect.assert(downloadRequestedHook);

  server.use(
    http.post("**/v0/store/torz", () =>
      HttpResponse.json<AddTorrentResponse>({ data: null }),
    ),
  );

  await expect(
    downloadRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHash: INFO_HASH, provider: "realdebrid" },
      logger,
      settings,
    }),
  ).rejects.toThrow(`No data returned from realdebrid for ${INFO_HASH}`);
});

it("rejects stores without an API key without sending a request", async ({
  server,
  plugin,
  settings,
  logger,
  dataSourceMap,
}) => {
  const downloadRequestedHook =
    plugin.hooks["riven.media-item.download.requested"];

  expect.assert(downloadRequestedHook);

  let requestCount = 0;

  server.use(
    http.post("**/v0/store/torz", () => {
      requestCount += 1;

      return HttpResponse.json(null, { status: 500 });
    }),
  );

  await expect(
    downloadRequestedHook({
      dataSources: dataSourceMap,
      event: { infoHash: INFO_HASH, provider: "torbox" },
      logger,
      settings,
    }),
  ).rejects.toThrow("Missing API key for torbox");
  expect(requestCount).toBe(0);
});
