// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { it as baseIt, expect, onTestFinished, vi } from "vitest";

import { startRedis } from "./start-redis.ts";
import { startRivenInstance } from "./start-riven-instance.ts";

vi.mock(import("./ensure-database.ts"), () => ({
  ensureDatabase: vi.fn<() => Promise<void>>(),
}));

vi.mock(import("./start-redis.ts"), () => ({
  startRedis: vi.fn<typeof startRedis>(),
}));

const it = baseIt.extend<{
  /** A directory for the test's files, which is also the OS temporary directory, where Riven's mount is made */
  directory: string;
  /** The `stop` of the Redis that `startRedis` starts */
  stopRedis: () => Promise<boolean>;
}>({
  directory: async ({}, use) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "start-riven-instance-"),
    );

    vi.stubEnv("TMPDIR", directory);

    await use(directory);

    vi.unstubAllEnvs();
    await rm(directory, { recursive: true });
  },
  stopRedis: async ({}, use) => {
    const stopRedis = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);

    vi.mocked(startRedis).mockResolvedValue({
      url: "redis://127.0.0.1:1",
      stop: stopRedis,
    });

    await use(stopRedis);
  },
});

// Clear of the ports that the E2E workers use, from 9200
const parallelIndex = 700;

it("stops Redis when a step after starting it fails", async ({
  directory,
  stopRedis,
}) => {
  const file = path.join(directory, "file");

  await writeFile(file, "");

  await expect(
    startRivenInstance({
      parallelIndex,
      postgresUrl: "postgres://127.0.0.1/postgres",
      origin: "http://localhost:9100",
      // The log's directory can't be created where there's a file
      logPath: path.join(file, "riven.log"),
    }),
  ).rejects.toThrow(/EEXIST/u);

  expect(stopRedis).toHaveBeenCalledOnce();
});

it("rejects with the log tail when Riven can't be spawned", async ({
  directory,
  stopRedis,
}) => {
  const { execPath } = process;

  process.execPath = path.join(directory, "missing-node");
  onTestFinished(() => {
    process.execPath = execPath;
  });

  await expect(
    startRivenInstance({
      parallelIndex,
      postgresUrl: "postgres://127.0.0.1/postgres",
      origin: "http://localhost:9100",
      logPath: path.join(directory, "riven.log"),
    }),
  ).rejects.toThrow(
    /^Riven couldn't be started: spawn \S+missing-node ENOENT\. Last log lines:/u,
  );

  expect(stopRedis).toHaveBeenCalledOnce();
});
