import type { FileChunkCalculations } from "../schemas/file-chunk-calculations.schema.ts";
import type { Dispatcher } from "undici";

export interface FileHandleMetadata {
  fileSize: number;
  filePath: string;
  fileName: string;
  url: string;
}

/**
 * Maps file descriptor (fd) to the corresponding `FileHandleMetadata`.
 */
export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();

/**
 * Maps file descriptor (fd) to the corresponding response data from Undici dispatcher.
 */
export const fdToResponseMap = new Map<number, Dispatcher.ResponseData>();

/**
 * Maps file name to its corresponding `FileChunkCalculations`.
 */
export const fileNameToFileChunkCalculationsMap = new Map<
  string,
  FileChunkCalculations
>();

/**
 * Maps file descriptor (fd) to the previous read position.
 */
export const fdToPreviousReadPositionMap = new Map<number, number>();

/**
 * Maps file descriptor (fd) to the current stream position.
 */
export const fdToCurrentStreamPositionMap = new Map<number, number>();

/**
 * Maps file name to a boolean indicating if the file is currently fetching its link.
 * This prevents duplicate fetches and potential race conditions.
 */
export const fileNameIsFetchingLinkMap = new Map<string, boolean>();
