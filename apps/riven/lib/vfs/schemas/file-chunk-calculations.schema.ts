import z from "zod";

import { ChunkMetadata } from "./chunk.schema.ts";

export const FileChunkCalculations = z.object({
  headerChunk: ChunkMetadata,
  footerChunk: ChunkMetadata,
  totalChunks: z.number().nonnegative(),
});

export type FileChunkCalculations = z.infer<typeof FileChunkCalculations>;
