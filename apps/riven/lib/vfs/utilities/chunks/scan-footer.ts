import { fetchDiscreteByteRange } from "./fetch-discrete-byte-range.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

/**
 * Scans the end of the media file for footer data.
 *
 * This "over-fetches" for the individual request,
 * but multiple footer requests tend to be made to retrieve more data later,
 * so this ends up being more efficient than making multiple small requests.
 */
export const scanFooter = async (
  fileHandle: FileHandleMetadata,
  readPosition: number,
  size: number,
) => {
  const data = await fetchDiscreteByteRange(
    fileHandle,
    readPosition,
    readPosition + size - 1,
  );

  return data.subarray(readPosition, readPosition + size);
};
