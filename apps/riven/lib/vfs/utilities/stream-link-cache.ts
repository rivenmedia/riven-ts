import { TTLCache } from "@isaacs/ttlcache";

import type { UUID } from "node:crypto";

/**
 * TTL cache for stream links, keyed by media entry ID.
 *
 * Most providers do not provide permalinks, so this provides an interface to easily
 * determine when to request a new stream link.
 */
export const streamLinkCache = new TTLCache<UUID, string>({
  noUpdateTTL: true,
  noDisposeOnSet: true,
});
