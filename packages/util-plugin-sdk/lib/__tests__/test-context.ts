import { MikroORM } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { RedisConnection } from "bullmq";
import { URL } from "node:url";
import { it as baseIt } from "vitest";

export const it = baseIt
  .extend("server", async ({}, { onCleanup }) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer();

    if (/^(\*|msw)/.test(process.env["DEBUG"] ?? "")) {
      server.events.on("response:mocked", ({ request, response }) => {
        console.log(
          "%s %s received %s %s",
          request.method,
          request.url,
          response.status,
          response.statusText,
        );
      });
    }

    server.listen({
      onUnhandledRequest: "error",
    });

    onCleanup(() => {
      server.close();
    });

    return server;
  })
  .extend(
    "orm",
    { scope: "worker" },
    // eslint-disable-next-line no-empty-pattern
    async ({}, { onCleanup }) => {
      const { SqliteDriver } = await import("@mikro-orm/sqlite");
      const {
        Episode,
        FileSystemEntry,
        ItemRequest,
        MediaEntry,
        MediaItem,
        Movie,
        Season,
        Show,
        SubtitleEntry,
        Stream,
      } = await import("../dto/entities/index.ts");

      const entities = [
        FileSystemEntry,
        MediaEntry,
        SubtitleEntry,
        MediaItem,
        Movie,
        Show,
        Season,
        Episode,
        ItemRequest,
        Stream,
      ];

      const orm = await MikroORM.init({
        driver: SqliteDriver,
        metadataProvider: TsMorphMetadataProvider,
        dbName: ":memory:",
        debug: false,
        entities,
      });

      await orm.schema.create();

      onCleanup(() => orm.close(true));

      return orm;
    },
  )
  .extend("em", ({ orm }) => orm.em.fork())
  .extend("redisClient", { scope: "file" }, async ({}, { onCleanup }) => {
    const { RedisMemoryServer } = await import("redis-memory-server");
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");

    async function getRedisServerBinary() {
      try {
        const { stdout: redisServerBinary } =
          await promisify(exec)("which redis-server");

        return redisServerBinary.trim();
      } catch (error) {
        throw new Error(
          `Failed to find "redis-server" binary. Is Redis installed and available in your PATH?\n${String(error)}`,
        );
      }
    }

    try {
      const systemBinary = await getRedisServerBinary();
      const redisServer = new RedisMemoryServer({ binary: { systemBinary } });

      const host = await redisServer.getHost();
      const port = await redisServer.getPort();

      const connection = new RedisConnection({ host, port });
      const client = await connection.client;

      await RedisConnection.waitUntilReady(client);

      onCleanup(async () => {
        await connection.close();
        await redisServer.stop();
      });

      return {
        client,
        url: new URL(`redis://${host}:${port.toString()}`),
      };
    } catch (error) {
      throw new Error(`Failed to get Redis URL.\n${String(error)}`);
    }
  });

it.afterEach(async ({ orm }) => {
  await orm.schema.clear();
});
