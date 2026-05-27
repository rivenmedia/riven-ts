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
      expect(url.searchParams.get("name")).toBe("Inception 2010");
      expect(url.searchParams.get("url")).toBe(
        "https://indexer.example.com/nzb/abc.nzb",
      );
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
            slots: [{ nzo_id: "X", status: "Completed", name: "Foo" }],
          },
        });
      }
      return HttpResponse.error();
    }),
  );

  const api = dataSourceMap.get(AltmountAPI);
  const status = await api.waitForCompletion("X");
  expect(status).toBe("completed");
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
