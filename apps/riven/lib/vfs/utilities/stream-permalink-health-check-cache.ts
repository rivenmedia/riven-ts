import { TTLCache } from "@isaacs/ttlcache";
import { Duration } from "luxon";

/**
 * TTL cache for stream permalink health checks, keyed by media entry ID.
 *
 * As permalinks are seldom refreshed, we need to check their health periodically,
 * unlike ephemeral stream links, which are checked after every refresh.
 */
export const streamPermalinkHealthCheckCache = new TTLCache<string, "healthy">({
  ttl: Duration.fromObject({ hours: 3 }).as("milliseconds"),
});
