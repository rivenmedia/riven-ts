import type { Dispatcher } from "undici";

export interface FileHandleMetadata {
  fileSize: number;
  filePath: string;
  url: string;
  client: Dispatcher;
  pathname: string;
}

export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();
