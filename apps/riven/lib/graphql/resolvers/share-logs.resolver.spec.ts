import { HttpResponse, http } from "msw/http";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { getSessionId } from "#utilities/logger/session-id.ts";

const logFile = vi.hoisted(() => ({ path: "" }));

vi.mock(import("#utilities/logger/logger.ts"), async (importOriginal) => ({
  ...(await importOriginal()),
  getEcsSymlinkPath: () => logFile.path,
}));

const SHARE_LOGS = "mutation { shareLogs }";
const BULK_URL = "https://elastic.dev.riven.tv/_bulk";

const it = baseIt.extend(
  "writeLogFile",
  async ({ overrideRuntimeSettings }, { onCleanup }) => {
    overrideRuntimeSettings({ general: { logging: { loggingEnabled: true } } });

    const directory = await mkdtemp(path.join(tmpdir(), "riven-logs-"));

    onCleanup(async () => {
      await rm(directory, { recursive: true });
    });

    return async (contents: string) => {
      logFile.path = path.join(directory, "ecs.log");

      await writeFile(logFile.path, contents);
    };
  },
);

it("uploads each log entry to Elasticsearch and returns the session ID", async ({
  gqlContext,
  gqlServer,
  server,
  writeLogFile,
}) => {
  const requests: { body: string; headers: Record<string, string> }[] = [];

  await writeLogFile(
    [
      JSON.stringify({ message: "first", level: "info" }),
      "",
      "not json",
      JSON.stringify({ message: "second", level: "error" }),
    ].join("\n"),
  );

  server.use(
    http.post(BULK_URL, async ({ request }) => {
      requests.push({
        body: await request.text(),
        headers: Object.fromEntries(request.headers),
      });

      return HttpResponse.json({ errors: false });
    }),
  );

  const { body } = await gqlServer.executeOperation(
    { query: SHARE_LOGS },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["shareLogs"]).toBe(getSessionId());

  const action = JSON.stringify({ index: { _index: "riven-shared-logs" } });

  expect(requests).toStrictEqual([
    {
      body: `${action}\n{"message":"first","level":"info"}\n${action}\n{"message":"second","level":"error"}\n`,
      headers: expect.objectContaining({
        "content-type": "application/x-ndjson",
        authorization: expect.stringMatching(/^Basic /u),
      }),
    },
  ]);
});

it.for([
  {
    scenario: "the log file has no entries",
    contents: "\nnot json\n",
    response: () => HttpResponse.json({}),
    error: "No log entries found within the last 24 hours.",
  },
  {
    scenario: "Elasticsearch rejects the upload",
    contents: JSON.stringify({ message: "first" }),
    response: () => HttpResponse.text("Forbidden", { status: 403 }),
    error: "Elasticsearch bulk index failed (403): Forbidden",
  },
])(
  "returns an error when $scenario",
  async (
    { contents, response, error },
    { gqlContext, gqlServer, server, writeLogFile },
  ) => {
    await writeLogFile(contents);

    server.use(http.post(BULK_URL, response));

    const { body } = await gqlServer.executeOperation(
      { query: SHARE_LOGS },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");
    expect(body.singleResult.errors).toMatchObject([{ message: error }]);
  },
);

it("returns an error without uploading when logging is disabled", async ({
  gqlContext,
  gqlServer,
  server,
  overrideRuntimeSettings,
}) => {
  let uploadCount = 0;

  overrideRuntimeSettings({ general: { logging: { loggingEnabled: false } } });

  server.use(
    http.post(BULK_URL, () => {
      uploadCount += 1;

      return HttpResponse.json({});
    }),
  );

  const { body } = await gqlServer.executeOperation(
    { query: SHARE_LOGS },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toMatchObject([
    { message: "Logging is disabled; cannot share logs." },
  ]);
  expect(uploadCount).toBe(0);
});
