import { describe, expect, it, vi } from "vitest";

import { config } from "../config.ts";
import { chunkCache } from "./chunk-cache.ts";
import { detectReadType } from "./detect-read-type.ts";

import type { ChunkMetadata } from "../schemas/chunk.schema.ts";
import type { FileChunkCalculations } from "../schemas/file-chunk-calculations.schema.ts";

function createChunk(
  start: number,
  end: number,
  cacheKey = `chunk-${start.toString()}-${end.toString()}`,
): ChunkMetadata {
  return {
    index: 0,
    isCached: false,
    cacheKey,
    rangeLabel: `${start.toString()}-${end.toString()}`,
    range: [start, end] as const,
    size: end - start + 1,
  };
}

const headerSize = config.headerSize; // 256 KB
const fileSize = 1024 * 1024 * 100; // 100 MB
const footerStart = fileSize - 1024 * 1024 * 2; // ~2 MB footer

const fileChunkCalculations: FileChunkCalculations = {
  headerChunk: createChunk(0, headerSize - 1),
  footerChunk: createChunk(footerStart, fileSize - 1),
  totalChunks: 100,
};

describe("detectReadType", () => {
  it('returns "footer-scan" when jumping to footer from a distant position', () => {
    const chunks = [createChunk(footerStart, footerStart + 1000)];

    const result = detectReadType(0, chunks, 1000, fileChunkCalculations);

    expect(result).toBe("footer-scan");
  });

  it('returns "general-scan" when jumping to a non-sequential position with small read', () => {
    const midPoint = headerSize + 1024 * 1024 * 50;
    const chunks = [createChunk(midPoint, midPoint + 100)];

    const result = detectReadType(
      undefined,
      chunks,
      100,
      fileChunkCalculations,
    );

    expect(result).toBe("general-scan");
  });

  it('returns "footer-read" when reading at the footer position sequentially', () => {
    const chunks = [createChunk(footerStart, footerStart + 1000)];

    const result = detectReadType(
      footerStart - 1,
      chunks,
      config.blockSize,
      fileChunkCalculations,
    );

    expect(result).toBe("footer-read");
  });
});
