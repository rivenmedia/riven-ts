import { LRUCache } from "lru-cache";

import type { Stats } from "@zkochan/fuse-native";
import type { PathLike } from "node:fs";

export const attrCache = new LRUCache<PathLike, Partial<Stats>>({
  ttl: 300_000,
  max: 1000,
  dispose: (_value, key, reason) => {
    if (reason === "delete" && key !== "/") {
      let match = /^.*(?=\/)/.exec(key.toString());

      if (!match) {
        return;
      }

      while (match) {
        const [matchPath] = match;

        attrCache.delete(matchPath || "/");

        const nextPart = matchPath.split("/").slice(0, -1).join("/");

        match = /^.*(?=\/)/.exec(nextPart);
      }

      return;
    }
  },
});
