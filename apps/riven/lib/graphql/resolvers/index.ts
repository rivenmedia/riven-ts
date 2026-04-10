import { EpisodeResolver } from "./episode.resolver.ts";
import { MediaEntryResolver } from "./media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

export const resolvers = [
  MediaItemResolver,
  EpisodeResolver,
  MovieResolver,
  SeasonResolver,
  ShowResolver,
  MediaEntryResolver,
  VfsResolver,
] as const;
