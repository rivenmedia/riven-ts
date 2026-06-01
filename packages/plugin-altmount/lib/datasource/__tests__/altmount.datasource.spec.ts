import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/altmount.test-context.ts";
import { AltmountAPI } from "../altmount.datasource.ts";

// ---------------------------------------------------------------------------
// validate()
// ---------------------------------------------------------------------------

it("validate() returns true when version endpoint responds 200", async ({
  server,
  dataSourceMap,
}) => {
  server.use(http.get("**/api", () => HttpResponse.json({ version: "1.0" })));

  const api = dataSourceMap.get(AltmountAPI);
  expect(await api.validate()).toBe(true);
});

it("validate() returns false on error", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({ error: "unauthorized" }, { status: 401 }),
    ),
  );

  const api = dataSourceMap.get(AltmountAPI);
  expect(await api.validate()).toBe(false);
});

// ---------------------------------------------------------------------------
// addurl()
// ---------------------------------------------------------------------------

it("addurl() returns the first nzo_id on success", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("mode")).toBe("addurl");
      expect(url.searchParams.get("apikey")).toBe("test-key");
      // SABnzbd-standard: the NZB URL goes in `name`, the human title in
      // `nzbname` (see the bc755c6c fix). There is no separate `url` param.
      expect(url.searchParams.get("name")).toBe(
        "https://indexer.example.com/nzb/abc.nzb",
      );
      expect(url.searchParams.get("nzbname")).toBe("Inception 2010");
      expect(url.searchParams.get("url")).toBeNull();
      return HttpResponse.json({
        status: true,
        nzo_ids: ["SABnzbd_nzo_xyz"],
      });
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  const nzoId = await api.addurl({
    nzbUrl: "https://indexer.example.com/nzb/abc.nzb",
    expectedTitle: "Inception 2010",
  });
  expect(nzoId).toBe("SABnzbd_nzo_xyz");
});

it("addurl() throws with the SAB error message when status is false", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({ status: false, error: "API Key Incorrect" }),
    ),
  );

  const api = dataSourceMap.get(AltmountAPI);
  await expect(
    api.addurl({ nzbUrl: "https://x/y.nzb", expectedTitle: "z" }),
  ).rejects.toThrow(/API Key Incorrect/i);
});

it("addurl() throws when status is true but nzo_ids is empty", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () => HttpResponse.json({ status: true, nzo_ids: [] })),
  );

  const api = dataSourceMap.get(AltmountAPI);
  await expect(
    api.addurl({ nzbUrl: "https://x/y.nzb", expectedTitle: "z" }),
  ).rejects.toThrow(/no nzo_ids/i);
});

// ---------------------------------------------------------------------------
// waitForCompletion()
// ---------------------------------------------------------------------------

it("waitForCompletion() polls queue, then sees Completed in history", async ({
  server,
  dataSourceMap,
}) => {
  let pollCount = 0;
  server.use(
    http.get("**/api", ({ request }) => {
      const url = new URL(request.url);
      const mode = url.searchParams.get("mode");
      if (mode === "queue") {
        pollCount++;
        // First 2 polls: still in queue. Then disappears.
        if (pollCount <= 2) {
          return HttpResponse.json({
            queue: {
              slots: [
                {
                  nzo_id: "X",
                  status: "Downloading",
                  percentage: "50",
                },
              ],
            },
          });
        }
        return HttpResponse.json({ queue: { slots: [] } });
      }
      if (mode === "history") {
        return HttpResponse.json({
          history: {
            slots: [
              {
                nzo_id: "X",
                status: "Completed",
                name: "Foo",
                storage: "/mnt/altmount/complete/Default",
                category: "Default",
                bytes: 12345,
              },
            ],
          },
        });
      }
      return HttpResponse.error();
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  const result = await api.waitForCompletion("X");
  expect(result.status).toBe("completed");
  expect(result.storage).toBe("/mnt/altmount/complete/Default");
  expect(result.name).toBe("Foo");
  expect(result.bytes).toBe(12345);
  expect(pollCount).toBeGreaterThanOrEqual(3);
});

it("waitForCompletion() throws with fail_message when history shows Failed", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", ({ request }) => {
      const mode = new URL(request.url).searchParams.get("mode");
      if (mode === "queue") return HttpResponse.json({ queue: { slots: [] } });
      if (mode === "history") {
        return HttpResponse.json({
          history: {
            slots: [
              {
                nzo_id: "X",
                status: "Failed",
                fail_message: "missing articles",
              },
            ],
          },
        });
      }
      return HttpResponse.error();
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  await expect(api.waitForCompletion("X")).rejects.toThrow(/missing articles/i);
});

it("waitForCompletion() throws when nzo_id is in neither queue nor history", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", ({ request }) => {
      const mode = new URL(request.url).searchParams.get("mode");
      if (mode === "queue") return HttpResponse.json({ queue: { slots: [] } });
      if (mode === "history") {
        return HttpResponse.json({ history: { slots: [] } });
      }
      return HttpResponse.error();
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  await expect(api.waitForCompletion("X")).rejects.toThrow(
    /not in queue or history/i,
  );
});

it("waitForCompletion() throws after pollTimeoutMs elapses", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/api", () =>
      HttpResponse.json({
        queue: { slots: [{ nzo_id: "X", status: "Downloading" }] },
      }),
    ),
  );

  // Override the API instance with a tighter timeout so the test runs quickly.
  // The test context's settings are pollIntervalMs=10, pollTimeoutMs=5000 by default;
  // 5s is fast enough for vitest's default timeout.
  const api = dataSourceMap.get(AltmountAPI);
  await expect(api.waitForCompletion("X")).rejects.toThrow(/poll timeout/i);
}, 10_000);

// ---------------------------------------------------------------------------
// resolveCompletedFile()
// ---------------------------------------------------------------------------

const PROPFIND_XML = `<?xml version="1.0" encoding="UTF-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype><D:displayname>Default</D:displayname></D:prop></D:propstat></D:response><D:response><D:href>/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:href><D:propstat><D:prop><D:resourcetype></D:resourcetype><D:displayname>Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv</D:displayname><D:getcontenttype>video/x-matroska</D:getcontenttype><D:getcontentlength>69347000342</D:getcontentlength></D:prop></D:propstat></D:response></D:multistatus>`;

it("resolveCompletedFile() PROPFINDs the dir and builds an authed WebDAV stream URL", async ({
  server,
  dataSourceMap,
}) => {
  let propfindUrl: string | undefined;
  let depthHeader: string | null = null;
  let authHeader: string | null = null;

  server.use(
    http.all("**/webdav/**", ({ request }) => {
      expect(request.method).toBe("PROPFIND");
      propfindUrl = request.url;
      depthHeader = request.headers.get("depth");
      authHeader = request.headers.get("authorization");
      return new HttpResponse(PROPFIND_XML, {
        status: 207,
        headers: { "content-type": "application/xml" },
      });
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  const file = await api.resolveCompletedFile({
    storage: "/mnt/altmount/complete/Default",
    name: "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
  });

  // PROPFIND targets the rebased WebDAV directory with Depth:1 + basic auth.
  expect(propfindUrl).toBe(
    "http://altmount.test:8081/webdav/complete/Default/",
  );
  expect(depthHeader).toBe("1");
  expect(authHeader).toBe(
    `Basic ${Buffer.from("usenet:secret").toString("base64")}`,
  );

  // The stream URL embeds credentials as userinfo (riven's VFS converts these
  // to an Authorization header — undici ignores raw URL userinfo).
  expect(file.streamUrl).toBe(
    "http://usenet:secret@altmount.test:8081/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
  );
  expect(file.fileSize).toBe(69347000342);
  expect(file.originalFilename).toBe(
    "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
  );
});

it("resolveCompletedFile() throws when no media file matches the release", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.all(
      "**/webdav/**",
      () =>
        new HttpResponse(
          `<D:multistatus xmlns:D="DAV:"><D:response><D:href>/webdav/complete/Default/</D:href><D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat></D:response></D:multistatus>`,
          { status: 207 },
        ),
    ),
  );

  const api = dataSourceMap.get(AltmountAPI);
  await expect(
    api.resolveCompletedFile({
      storage: "/mnt/altmount/complete/Default",
      name: "Missing.Movie.2099",
    }),
  ).rejects.toThrow(/no media file/i);
});
