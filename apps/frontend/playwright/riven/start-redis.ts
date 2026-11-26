import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { RedisMemoryServer } from "redis-memory-server";

/** Starts a Redis from the `redis-server` on `PATH`, on a free port */
export async function startRedis() {
  // oxlint-disable-next-line typescript/strict-void-return -- `promisify` only uses `execFile`'s callback, so ignoring the `ChildProcess` it returns is fine
  const { stdout } = await promisify(execFile)("which", ["redis-server"]);
  const redis = new RedisMemoryServer({
    binary: { systemBinary: stdout.trim() },
  });

  return {
    url: `redis://${await redis.getHost()}:${String(await redis.getPort())}`,
    stop: () => redis.stop(),
  };
}
