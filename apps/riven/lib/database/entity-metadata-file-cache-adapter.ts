import { FileCacheAdapter } from "@mikro-orm/core/fs-utils";

/**
 * A file cache for entity metadata that ignores each entity's cached `_id`.
 *
 * MikroORM assigns `_id` from a per-process counter, so it depends on the order entities are loaded in.
 * A cached `_id` can therefore match another entity's `_id` in a process that loaded its entities
 * in a different order, such as parallel test workers sharing the cache.
 * The schema generator keys entities by `_id`, so a clash silently drops one of their tables.
 */
export class EntityMetadataFileCacheAdapter extends FileCacheAdapter {
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- Matches the signature of `SyncCacheAdapter#get`
  public override get<T>(name: string): T | undefined {
    const cached = super.get(name) as Record<string, unknown> | null;

    if (!cached) {
      return undefined;
    }

    const { _id, ...metadata } = cached;

    return metadata as T;
  }
}
