import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";

import type { FindOneOrFailOptions } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

export class MediaEntryService extends BaseService {
  @CreateRequestContext()
  async getMediaEntryById<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    id: UUID,
    options?: FindOneOrFailOptions<MediaEntry, Hint, Fields, Excludes>,
  ) {
    return this.em.getRepository(MediaEntry).findOneOrFail(id, options);
  }
}
