import type { InMemoryCacheConfig } from "@apollo/client";

export const cacheOptions = {
  possibleTypes: {
    MediaItem: ["Movie", "Show", "Season", "Episode"],
    ShowLikeMediaItem: ["Show", "Season", "Episode"],
  },
  typePolicies: {
    TmdbIndexerData: {
      keyFields: ["type", "id"],
    },
  },
} satisfies InMemoryCacheConfig;
