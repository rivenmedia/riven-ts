import { exec } from "node:child_process";
import { promisify } from "node:util";
import { RedisMemoryServer } from "redis-memory-server";

let redisServer: RedisMemoryServer;

export async function setup() {
  try {
    const { stdout: redisServerBinary } =
      await promisify(exec)("which redis-server");

    redisServer = new RedisMemoryServer({
      binary: {
        systemBinary: redisServerBinary.trim(),
      },
    });

    const host = await redisServer.getHost();
    const port = await redisServer.getPort();

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env["RIVEN_SETTING__redisUrl"] =
      `redis://${host}:${port.toString()}`;
  } catch (error) {
    throw new Error(
      `Failed to start Redis Memory Server. Is "redis-server" is installed?\n${String(error)}`,
    );
  }
}

export async function teardown() {
  await redisServer.stop();
}
