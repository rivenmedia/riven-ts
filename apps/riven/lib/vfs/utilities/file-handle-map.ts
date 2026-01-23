import type { Dispatcher } from "undici";

export interface FileHandleMetadata {
  fileId: number;
  fileSize: number;
  filePath: string;
  url: string;
}

export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();

export const fdToResponseMap = new Map<number, Dispatcher.ResponseData>();
