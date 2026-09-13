import { LRUCache } from "lru-cache";

import { logger } from "../../utilities/logger/logger.ts";

import type { Buffer } from "node:buffer";

export const chunkCache = new LRUCache<string, Buffer>({
  maxSize: 1024 ** 2 * 50, // 50 MB
  sizeCalculation(value, _key) {
    return value.byteLength;
  },
  dispose: (_value, key, reason) => {
    logger.silly(`Evicted chunk ${key} from chunk cache: ${reason}`);
  },
});
