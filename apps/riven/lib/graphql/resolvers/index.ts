import { EpisodeResolver } from "./episode.resolver.ts";
import { ItemRequestResolver } from "./item-request.resolver.ts";
import { MediaEntryResolver } from "./media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShareLogsResolver } from "./share-logs.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

export const resolvers = [
  MediaItemResolver,
  MediaEntryResolver,
  EpisodeResolver,
  ItemRequestResolver,
  MovieResolver,
  SeasonResolver,
  ShareLogsResolver,
  ShowResolver,
  VfsResolver,
] as const;
