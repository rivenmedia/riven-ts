import {
  BlacklistedStream,
  MediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import type { EntityManager } from "@mikro-orm/core";

export async function blacklistStream(
  em: EntityManager,
  mediaItem: MediaItem,
  infoHash: string,
  plugin: string,
  provider: string | null,
) {
  em.create(BlacklistedStream, {
    mediaItem,
    stream: infoHash,
    plugin,
    provider,
  });

  mediaItem.activeStream = null;
  mediaItem.filesystemEntries.remove((entry) => entry.type === "media");

  await em.flush();
}
