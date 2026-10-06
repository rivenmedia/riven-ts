import { EpisodeResolver } from "./episode.resolver.ts";
import { FileSystemEntryResolver } from "./filesystem-entry/filesystem-entry.resolver.ts";
import { IndexerDataResolver } from "./indexer-data.resolver.ts";
import { ItemRequestResolver } from "./item-request.resolver.ts";
import { MediaEntryResolver } from "./media-entry.resolver.ts";
import { MediaItemResolver } from "./media-item.resolver.ts";
import { MovieResolver } from "./movie.resolver.ts";
import { SeasonResolver } from "./season.resolver.ts";
import { ShareLogsResolver } from "./share-logs.resolver.ts";
import { ShowResolver } from "./show.resolver.ts";
import { TempFrontendResolver } from "./temp-frontend.resolver.ts";
import { VfsResolver } from "./vfs/vfs.resolver.ts";

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
  TempFrontendResolver,
] as const;
