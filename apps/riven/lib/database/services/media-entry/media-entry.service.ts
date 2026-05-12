import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";

import type { FilterQuery, FindOneOrFailOptions } from "@mikro-orm/core";

export class MediaEntryService extends BaseService {
  @CreateRequestContext()
  async getMediaEntry<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    where: FilterQuery<MediaEntry>,
    options?: FindOneOrFailOptions<MediaEntry, Hint, Fields, Excludes>,
  ) {
    return this.em.getRepository(MediaEntry).findOneOrFail(where, options);
  }
}
