import { LRUCache } from "lru-cache";

export const chunkCache = new LRUCache<string, Buffer>({
  maxSize: Math.pow(1024, 3), // 1 GB
  sizeCalculation(value, _key) {
    return value.byteLength;
  },
});
