import type { LRUCache } from "lru-cache";
import type { Dispatcher } from "undici";

export interface FileHandleMetadata {
  fileSize: number;
  filePath: string;
  url: string;
  client: Dispatcher;
  pathname: string;
  cache: LRUCache<`${string}-${string}`, Buffer[]>;
}

export const fdToFileHandleMeta = new Map<number, FileHandleMetadata>();
