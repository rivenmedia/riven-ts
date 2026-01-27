import { logger } from "@repo/core-util-logger";

import { LRUCache } from "lru-cache";

export const chunkCache = new LRUCache<string, Buffer>({
  maxSize: Math.pow(1024, 3), // 1 GB
  sizeCalculation(value, _key) {
    return value.byteLength;
  },
  dispose: (_value, key, reason) => {
    logger.silly(`Evicted chunk ${key} from chunk cache: ${reason}`);
  },
});
