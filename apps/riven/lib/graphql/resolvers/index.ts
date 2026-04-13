import { EpisodeResolver } from "./episode.resolver.ts";
import { ItemRequestResolver } from "./item-request/item-request.resolver.ts";
import { MediaEntryResolver } from "./media-entry/media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

export const resolvers = [
  MediaItemResolver,
  MediaEntryResolver,
  EpisodeResolver,
  MovieResolver,
  SeasonResolver,
  ShowResolver,
  VfsResolver,
  ItemRequestResolver,
] as const;
