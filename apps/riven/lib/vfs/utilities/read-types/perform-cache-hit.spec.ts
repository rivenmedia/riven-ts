import Fuse from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";
import { expect, it } from "vitest";

import { withReadContext } from "#vfs/__tests__/with-read-context.ts";
import { ChunkMetadata } from "#vfs/schemas/chunk.schema.ts";
import { chunkCache } from "#vfs/utilities/chunk-cache.ts";

import { performCacheHit } from "./perform-cache-hit.ts";

const chunks = [
  ChunkMetadata.parse({ fileName: "movie.mkv", index: 0, start: 0, end: 3 }),
  ChunkMetadata.parse({ fileName: "movie.mkv", index: 1, start: 4, end: 7 }),
];

it.beforeEach(() => {
  chunkCache.clear();
});

it("joins the cached chunks in order", () => {
  chunkCache.set(chunks[1]?.cacheKey ?? "", Buffer.from("5678"));
  chunkCache.set(chunks[0]?.cacheKey ?? "", Buffer.from("1234"));

  expect(performCacheHit(chunks).toString()).toBe("12345678");
});

it("fails with EIO when a chunk is no longer cached", async () => {
  chunkCache.set(chunks[0]?.cacheKey ?? "", Buffer.from("1234"));

  await expect(
    withReadContext(() => performCacheHit(chunks)),
  ).rejects.toMatchObject({
    name: "FuseError",
    errorCode: Fuse.EIO,
    message: expect.stringContaining(
      "Expected chunk to be cached for cache-hit read type",
    ),
  });
});
