import { type } from "arktype";

import { ChunkMetadata } from "./chunk.schema.ts";

export const FileChunkCalculations = type({
  headerChunk: ChunkMetadata,
  footerChunk: ChunkMetadata,
  totalChunks: "number >= 0",
});

export type FileChunkCalculations = typeof FileChunkCalculations.infer;
