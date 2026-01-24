import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";
import { setTimeout as sleep } from "node:timers/promises";

import { config } from "../../config.ts";
import { FuseError } from "../../errors/fuse-error.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";
import type BodyReadable from "undici/types/readable.js";

export const waitForChunk = async (
  reader: BodyReadable.default,
  targetChunk: ChunkMetadata,
): Promise<Buffer> => {
  let chunk: Buffer | null = null;

  const timeout = setTimeout(() => {
    throw new FuseError(Fuse.ETIMEDOUT, `Timeout waiting for chunk`);
  }, config.chunkTimeoutSeconds * 1000);

  while ((chunk = reader.read(targetChunk.size) as Buffer | null) === null) {
    await sleep(50);
  }

  logger.silly(
    `Fetched chunk ${targetChunk.rangeLabel} (${chunk.byteLength.toString()} bytes)`,
  );

  clearTimeout(timeout);

  return chunk;
};
