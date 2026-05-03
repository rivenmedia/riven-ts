import { EntityRepository } from "@mikro-orm/core";

import type { MediaItem } from "../entities/index.ts";

export abstract class MediaItemRepository<
  T extends MediaItem,
> extends EntityRepository<T> {}
