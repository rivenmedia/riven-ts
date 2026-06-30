import { AuthResolver } from "./auth/auth.resolver.ts";
import { EpisodeResolver } from "./episode.resolver.ts";
import { InstanceStatusResolver } from "./instance-status/instance-status.resolver.ts";
import { MediaEntryResolver } from "./media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShareLogsResolver } from "./share-logs.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

export const resolvers = [
  AuthResolver,
  MediaItemResolver,
  MediaEntryResolver,
  EpisodeResolver,
  InstanceStatusResolver,
  MovieResolver,
  SeasonResolver,
  ShareLogsResolver,
  ShowResolver,
  VfsResolver,
] as const;
