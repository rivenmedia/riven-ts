import type { Dispatcher } from "undici";

export interface FileHandleMetadata {
  fileId: number;
  fileSize: number;
  filePath: string;
  url: string;
  client: Dispatcher;
}

export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();
