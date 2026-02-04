import { LRUCache } from "lru-cache";
import { Buffer } from "node:buffer";

import { logger } from "../../utilities/logger/logger.ts";

export const chunkCache = new LRUCache<string, Buffer>({
  maxSize: Math.pow(1024, 3), // 1 GB
  sizeCalculation(value, _key) {
    return value.byteLength;
  },
  dispose: (_value, key, reason) => {
    logger.silly(`Evicted chunk ${key} from chunk cache: ${reason}`);
  },
});
