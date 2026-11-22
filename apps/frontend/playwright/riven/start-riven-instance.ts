import { createE2eControlClient, createE2eEnvironment } from "@repo/riven/e2e";

import { execFile, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import pg from "pg";
import { RedisMemoryServer } from "redis-memory-server";
import { z } from "zod";

import { backendApiKey } from "../backend-environment.ts";
import { assertPortIsFree } from "./assert-port-is-free.ts";
import { waitUntilReady } from "./wait-until-ready.ts";

import type { ChildProcess } from "node:child_process";

interface StartRivenInstanceInput {
  /** Playwright's `parallelIndex`, which keys the instance's port, database and mount */
  parallelIndex: number;

  /** A Postgres URL whose user can create databases */
  postgresUrl: string;

  /** The frontend's origin, which Riven's auth trusts */
  origin: string;

  /** Where Riven's stdout and stderr are written */
  logPath: string;
}

export interface RivenInstance {
  url: URL;
  logPath: string;
  control: ReturnType<typeof createE2eControlClient>;
  stop: () => Promise<void>;
}

/** The only variables Riven inherits, so nothing from the local environment changes how it boots */
const inheritedEnvironment = z.object({
  PATH: z.string(),
  HOME: z.string(),
});

const readyTimeoutMs = 60_000;
const stopTimeoutMs = 15_000;
const logTailLines = 50;

// Resolves to `<riven>/lib/mocks/e2e/index.ts`
const rivenDirectory = fileURLToPath(
  new URL("../../../", import.meta.resolve("@repo/riven/e2e")),
);

async function ensureDatabase(postgresUrl: string, name: string) {
  const client = new pg.Client({ connectionString: postgresUrl });

  await client.connect();

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );

    if (!rowCount) {
      // oxlint-disable-next-line sonarjs/sql-queries -- the name is escaped, and identifiers can't be parameters
      await client.query(`CREATE DATABASE ${client.escapeIdentifier(name)}`);
    }
  } finally {
    await client.end();
  }
}

async function startRedis() {
  // oxlint-disable-next-line typescript/strict-void-return
  const { stdout } = await promisify(execFile)("which", ["redis-server"]);
  const redis = new RedisMemoryServer({
    binary: { systemBinary: stdout.trim() },
  });

  return {
    url: `redis://${await redis.getHost()}:${String(await redis.getPort())}`,
    stop: () => redis.stop(),
  };
}

/**
 * Creates the directory Riven mounts its VFS on.
 *
 * A run whose Riven was killed leaves the directory as a stale FUSE mount, which can't be read (`ENOTCONN`).
 * It's left for Riven to remount over, as `vfsForceMount` is enabled by default.
 */
async function createMountDirectory(vfsMountPath: string) {
  try {
    await mkdir(vfsMountPath, { recursive: true });
  } catch (error) {
    if (
      !(error instanceof Error && "code" in error && error.code === "ENOTCONN")
    ) {
      throw error;
    }
  }
}

async function readLogTail(logPath: string) {
  const log = await readFile(logPath, "utf8").catch(() => "");

  return log.trimEnd().split("\n").slice(-logTailLines).join("\n");
}

/** Resolves once the process has exited and its output has been written, unlike its `exit` event */
function waitForClose(child: ChildProcess) {
  return new Promise<number | null>((resolve) => {
    child.once("close", (code) => {
      resolve(code);
    });
  });
}

/**
 * Starts a built Riven in test mode, with its own database, Redis and mount, keyed by `parallelIndex`.
 *
 * Riven is spawned directly with an explicit environment, rather than with `pnpm start`, which would load the
 * local `.env.riven` and leak real hosts and keys into the instance.
 */
export async function startRivenInstance({
  parallelIndex,
  postgresUrl,
  origin,
  logPath,
}: StartRivenInstanceInput): Promise<RivenInstance> {
  const databaseName = `riven_e2e_${String(parallelIndex)}`;
  const databaseUrl = new URL(postgresUrl);

  databaseUrl.pathname = `/${databaseName}`;

  const vfsMountPath = path.join(
    os.tmpdir(),
    `riven-e2e-${String(parallelIndex)}`,
  );
  const port = 9200 + parallelIndex;
  const url = new URL(`http://127.0.0.1:${String(port)}`);

  // Before anything else is started, so a stale Riven on the port fails the run, rather than answering for this one
  await assertPortIsFree(port, url.hostname);
  await ensureDatabase(postgresUrl, databaseName);

  const redis = await startRedis();

  await createMountDirectory(vfsMountPath);
  await mkdir(path.dirname(logPath), { recursive: true });

  const log = createWriteStream(logPath);
  const child = spawn(
    process.execPath,
    ["--conditions=production", "--enable-source-maps", "dist/lib/index.js"],
    {
      cwd: rivenDirectory,
      env: {
        ...createE2eEnvironment({
          port,
          databaseUrl: databaseUrl.toString(),
          redisUrl: redis.url,
          vfsMountPath,
          apiKey: backendApiKey,
          origin,
        }),
        ...inheritedEnvironment.parse(process.env),
        // Already set by `createE2eEnvironment`, but Next.js' types require it to be one of its known modes
        NODE_ENV: "test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });

  const exited = waitForClose(child);

  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");

      const killTimer = setTimeout(() => {
        child.kill("SIGKILL");
      }, stopTimeoutMs);

      await exited;
      clearTimeout(killTimer);
    }

    await new Promise((resolve) => {
      log.end(resolve);
    });
    await redis.stop();
  };

  if (!(await waitUntilReady({ url, child, timeoutMs: readyTimeoutMs }))) {
    const { exitCode } = child;

    await stop();

    const tail = await readLogTail(logPath);

    throw new Error(
      exitCode === null
        ? `Riven wasn't ready within ${String(readyTimeoutMs / 1000)} s. Last log lines:\n${tail}`
        : `Riven exited with code ${String(exitCode)} before it was ready. Last log lines:\n${tail}`,
    );
  }

  return {
    url,
    logPath,
    control: createE2eControlClient(url, backendApiKey),
    stop,
  };
}
