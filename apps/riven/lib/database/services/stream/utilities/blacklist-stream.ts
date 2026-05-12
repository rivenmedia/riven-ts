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

  const mediaEntries = await mediaItem.getMediaEntries();

  mediaItem.filesystemEntries.remove(mediaEntries);

  for (const entry of mediaEntries) {
    em.remove(entry);
  }

  await em.flush();
}
