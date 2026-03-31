import type { FileChunkCalculations } from "../schemas/file-chunk-calculations.schema.ts";
import type { Dispatcher } from "undici";

interface FileHandleMetadataBase {
  fileSize: number;
  filePath: string;
  fileBaseName: string;
}

export interface MediaFileHandleMetadata extends FileHandleMetadataBase {
  type: "media";
  originalFileName: string;
  url: string;
}

export interface SubtitleFileHandleMetadata extends FileHandleMetadataBase {
  type: "subtitle";
  contentBuffer: Buffer;
}

export type FileHandleMetadata =
  | MediaFileHandleMetadata
  | SubtitleFileHandleMetadata;

/**
 * Maps file descriptor (fd) to the corresponding `FileHandleMetadata`.
 */
export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();

/**
 * Maps file descriptor (fd) to the promise of the response data, used to cache the initial stream request for each fd.
 */
export const fdToResponsePromiseMap = new Map<
  number,
  Promise<Dispatcher.ResponseData>
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
 * Maps file name to its corresponding `FileChunkCalculations`.
 */
export const fileNameToFileChunkCalculationsMap = new Map<
  string,
  FileChunkCalculations
>();

/**
 * Maps file name to its corresponding file descriptor (fd) count.
 *
 * This helps track how many active file descriptors are associated with each file,
 * which is useful for resource management and cleanup when files are closed.
 */
export const fileNameToFdCountMap = new Map<string, number>();

/**
 * Maps file name to a boolean indicating if the file is currently fetching its link.
 * This prevents duplicate fetches and potential race conditions.
 */
export const fileNameIsFetchingLinkMap = new Map<string, boolean>();
