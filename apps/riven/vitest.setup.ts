import { BaseDataSource } from "@repo/util-plugin-sdk";
import { RivenEventHandler } from "@repo/util-plugin-sdk/events";

import { RedisConnection } from "bullmq";
import { randomUUID } from "node:crypto";
import { setEnvironmentData } from "node:worker_threads";
import {
  afterAll,
  aroundEach,
  beforeAll,
  beforeEach,
  expect,
  vi,
} from "vitest";
import z from "zod";

import { withLogContext } from "./lib/utilities/logger/log-context.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { RedisClient } from "bullmq";
import type { RedisMemoryServer } from "redis-memory-server";
import type { Mock } from "vitest";

vi.mock<{ default: Record<string, unknown> }>(
  import("./package.json"),
  () =>
    ({
      default: {
        name: "riven",
        version: "1.0.0-mock",
        dependencies: {
          "@repo/plugin-test": "workspace:^",
        },
      },
    }) as const,
);

vi.mock(import("@repo/plugin-test"), () => {
  class TestAPI extends BaseDataSource<Record<string, unknown>> {
    public override baseURL = "https://api.test.com";

    public override validate() {
      return true;
    }
  }

  class TestResolver {
    public testIsValid() {
      return true;
    }
  }

  return {
    plugin: {
      version: "1.0.0-mock",
      name: Symbol.for("@repo/plugin-test"),
      dataSources: [TestAPI],
      resolvers: [TestResolver],
      // Listen to all events with a mock function, as plugin subscribers are filtered based
      // on the presence of a handler for the event type.
      hooks: Object.fromEntries(
        Object.keys(RivenEventHandler).map((key) => [key, vi.fn()]),
      ),
      settingsSchema: z.object({}),
      async validator() {
        return Promise.resolve(true);
      },
    } satisfies RivenPlugin,
  };
});

vi.mock(import("./lib/database/database.ts"), async (importOriginal) => {
  const { initORM } = await importOriginal();
  const { createDatabaseConfig } = await import("./lib/database/config.ts");
  const { SeedManager } = await import("@mikro-orm/seeder");
  const { SqliteDriver } = await import("@mikro-orm/sqlite");
  const databaseConfig = await createDatabaseConfig();

  const { database, services } = await initORM({
    ...databaseConfig,
    dbName: ":memory:",
    driver: SqliteDriver,
    migrations: {
      migrationsList: [],
    },
    debug: false,
    extensions: [SeedManager],
    seeder: {
      pathTs: "./seeders",
    },
  });

  await database.orm.schema.create();

  return {
    database,
    services,
    initORM,
  };
});

expect.extend({
  toHaveReceivedEvent(actorRef: { id: string; send: Mock }, expected: unknown) {
    try {
      expect(actorRef.send).toHaveBeenCalledWith(expected);

      return {
        pass: true,
        message: () =>
          `Actor "${actorRef.id}" received event:\n${this.utils.printExpected(expected)}`,
      };
    } catch {
      return {
        pass: false,
        message: () =>
          `Actor "${actorRef.id}" did not receive event:\n${this.utils.printReceived(expected)}.\nReceived events:\n${this.utils.printExpected(actorRef.send.mock.calls.flat())}`,
      };
    }
  },
});

let redisServer: RedisMemoryServer | null = null;
let redisConnection: RedisConnection | null = null;
let redisClient: RedisClient | null = null;

vi.doMock(import("./lib/utilities/settings.ts"), async (importOriginal) => {
  const { RedisMemoryServer } = await import("redis-memory-server");
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");

  async function getRedisServerBinary() {
    try {
      const { stdout: redisServerBinary } =
        // oxlint-disable-next-line typescript/strict-void-return
        await promisify(exec)("which redis-server");

      return redisServerBinary.trim();
    } catch (error) {
      throw new Error(
        `Failed to find "redis-server" binary. Is Redis installed and available in your PATH?\n${String(error)}`,
        { cause: error },
      );
    }
  }

  async function getRedisUrl() {
    try {
      const systemBinary = await getRedisServerBinary();

      redisServer = new RedisMemoryServer({ binary: { systemBinary } });

      const host = await redisServer.getHost();
      const port = await redisServer.getPort();

      redisConnection = new RedisConnection({ host, port });
      redisClient = await redisConnection.client;

      await RedisConnection.waitUntilReady(redisClient);

      return `redis://${host}:${port.toString()}`;
    } catch (error) {
      throw new Error(`Failed to get Redis URL.\n${String(error)}`, {
        cause: error,
      });
    }
  }

  // Set the Redis URL setting before importing the settings module,
  // as the settings are validated and frozen on first import.
  // This allows us to use a dynamically created Redis instance per test file.

  process.env["RIVEN_SETTING__redisUrl"] = await getRedisUrl();

  return importOriginal();
});

aroundEach(async (runTest) =>
  withLogContext(
    {
      "riven.log.source": "vitest",
    },
    runTest,
  ),
);

beforeAll(() => {
  setEnvironmentData("riven.session.id", randomUUID());
});

beforeEach(async () => {
  const { database } = await import("./lib/database/database.ts");

  await database.orm.schema.clear();
  await redisClient?.flushdb();
});

afterAll(async () => {
  await redisConnection?.close();
  await redisServer?.stop();
});
