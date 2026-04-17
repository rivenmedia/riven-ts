import { EntityRepository } from "@mikro-orm/core";

import type { MediaEntry } from "../entities/index.ts";
import type { UUID } from "node:crypto";

export class MediaEntryRepository extends EntityRepository<MediaEntry> {
  async saveStreamUrl(id: UUID, url: string) {
    const entry = await this.findOneOrFail(id);

    this.assign(entry, {
      streamUrl: url,
    });

    await this.em.flush();

    return entry;
  }
}
