import { config } from "../../config.ts";
import { fetchDiscreteByteRange } from "./fetch-discrete-byte-range.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

/**
 * Scans the start of the media file for header data.
 */
export const scanHeader = async (
  fileHandle: FileHandleMetadata,
  readPosition: number,
  size: number,
) => {
  const data = await fetchDiscreteByteRange(
    fileHandle,
    0,
    config.headerSize - 1,
  );

  return data.subarray(readPosition, readPosition + size);
};
