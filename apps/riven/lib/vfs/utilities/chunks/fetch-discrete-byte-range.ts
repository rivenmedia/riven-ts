import { create } from "shm-typed-array";

import { createStreamRequest } from "../requests/create-stream-request.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export const fetchDiscreteByteRange = async (
  fileHandle: FileHandleMetadata,
  start: number,
  end: number,
  shouldCache = true,
) => {
  const response = await createStreamRequest(fileHandle, start, end);
  const data = await response.body.arrayBuffer();
  const buffer = Buffer.from(data);

  if (shouldCache) {
    create(data.byteLength, "Buffer")?.set(buffer);
  }

  return buffer;
};
