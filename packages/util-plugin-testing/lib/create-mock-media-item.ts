import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

/**
 * A partial fake of a media item that only knows its identity and the media
 * entries it reports. Enough for hooks that read nothing else from the item.
 */
export const createMockMediaItem = (
  entries: { baseDirectory: "movies" | "shows"; path: string }[],
) =>
  ({
    id: "00000000-0000-4000-8000-000000000001",
    fullTitle: "Test Item",
    getMediaEntries: async () => Promise.resolve(entries),
  }) as unknown as MediaItem;
