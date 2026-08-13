import { Module } from "@nestjs/common";

import { redisCache } from "../utilities/redis-cache.ts";

export const RIVEN_CACHE = Symbol("RIVEN_CACHE");

/**
 * Exposes the shared Redis cache to the DI container.
 *
 * The underlying Keyv connection is established at import time and shared by
 * Apollo Server and every plugin data source, so the existing singleton is
 * surfaced as a value provider rather than opening a second connection.
 */
@Module({
  providers: [{ provide: RIVEN_CACHE, useValue: redisCache }],
  exports: [RIVEN_CACHE],
})
export class CacheModule {}
