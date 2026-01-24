import { LRUCache } from "lru-cache";
import { Agent, interceptors } from "undici";

import { config } from "../../config.ts";

const lru = new LRUCache<string, interceptors.DNSInterceptorOriginRecords>({
  max: 1000,
});

const lruAdapter = {
  get size() {
    return lru.size;
  },
  get(origin) {
    return lru.get(origin) ?? null;
  },
  set(origin, records) {
    lru.set(origin, records ?? undefined);
  },
  delete(origin) {
    lru.delete(origin);
  },
  full() {
    // For LRU cache, we can always store new records,
    // old records will be evicted automatically
    return false;
  },
} satisfies interceptors.DNSStorage;

export const requestAgent = new Agent({
  allowH2: true,
  keepAliveMaxTimeout: config.activityTimeoutSeconds * 1000,
  connect: {
    timeout: config.connectTimeoutSeconds * 1000,
  },
}).compose(
  interceptors.dns({
    storage: lruAdapter,
  }),
  interceptors.deduplicate(),
  interceptors.retry(),
);
