import { LRUCache } from "lru-cache";

import type { Stats } from "@zkochan/fuse-native";
import type { PathLike } from "node:fs";

export const attrCache = new LRUCache<PathLike, Partial<Stats>>({
  ttl: 300_000,
  ttlAutopurge: false,
  max: 1000,
  dispose: (_value, key, reason) => {
    if (reason === "delete" && key !== "/") {
      const match = /^.*(?=\/)/.exec(key.toString());

      if (match) {
        attrCache.delete(match[0] || "/");
      }

      return true;
    }

    return true;
  },
});
