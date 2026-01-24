import { fetchDiscreteByteRange } from "./fetch-discrete-byte-range.ts";

import type { ChunkMetadata } from "../../schemas/chunk.schema.ts";
import type { FileHandleMetadata } from "../file-handle-map.ts";

/**
 * Scans a specific chunk of the media file for data, returning a subset based on the read position and size.
 *
 * @param fileHandle - The metadata of the file handle.
 * @param chunk - The chunk metadata to scan.
 * @param readPosition - The position within the chunk to start reading from.
 * @param size - The number of bytes to read.
 */
export const scanChunk = async (
  fileHandle: FileHandleMetadata,
  { range: [chunkStart, chunkEnd] }: ChunkMetadata,
  readPosition: number,
  size: number,
) => {
  const data = await fetchDiscreteByteRange(fileHandle, chunkStart, chunkEnd);

  return data.subarray(
    readPosition - chunkStart,
    readPosition - chunkStart + size,
  );
};
