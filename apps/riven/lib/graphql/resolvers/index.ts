import { AuthResolver } from "./auth/auth.resolver.ts";
import { EpisodeResolver } from "./episode.resolver.ts";
import { FileSystemEntryResolver } from "./filesystem-entry/filesystem-entry.resolver.ts";
import { IndexerDataResolver } from "./indexer-data.resolver.ts";
import { IndexerEpisodeResolver } from "./indexer-episode.resolver.ts";
import { IndexerQueryResolver } from "./indexer-query.resolver.ts";
import { IndexerSeasonResolver } from "./indexer-season.resolver.ts";
import { InstanceResolver } from "./instance/instance.resolver.ts";
import { ItemRequestResolver } from "./item-request/item-request.resolver.ts";
import { MediaEntryResolver } from "./media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item/media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShareLogsResolver } from "./share-logs.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

import type { Constructor } from "type-graphql";

export const resolvers = [
  MediaItemResolver,
  MediaEntryResolver,
  EpisodeResolver,
  FileSystemEntryResolver,
  ItemRequestResolver,
  MovieResolver,
  SeasonResolver,
  ShareLogsResolver,
  ShowResolver,
  VfsResolver,
  IndexerDataResolver,
  IndexerQueryResolver,
  IndexerSeasonResolver,
  IndexerEpisodeResolver,
  AuthResolver,
  InstanceResolver,
] as const satisfies Constructor<object>[];
