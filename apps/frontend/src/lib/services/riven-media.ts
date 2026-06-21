/**
 * Riven media GraphQL operations and response mappers.
 *
 * Unlike `backend-metadata.ts` (whose operations are server-only and thus
 * wrapped in `ctx`-based fetch helpers), the operations here are exported as
 * raw, transport-agnostic strings on purpose: the same constant is consumed
 * across all three transports — `gql` (server load), `gqlClient` (client proxy)
 * and `gqlSubscribeClient` (WebSocket). Do not "consolidate" these into fetch
 * wrappers; a single wrapper cannot serve all three transports.
 */
import type {
  FilesystemEntry,
  MediaMetadata,
  RivenMediaItem,
} from "$lib/types/riven";

interface GqlFilesystemEntry {
  id?: number | null;
  fileSize?: number | null;
  originalFilename?: string | null;
  downloadUrl?: string | null;
  provider?: string | null;
  providerDownloadId?: string | null;
  path?: string | null;
  plugin?: string | null;
  rankingProfileName?: string | null;
  mediaMetadata?: unknown;
}

interface GqlEpisodeFull {
  episodeNumber: number;
  state: string;
  filesystemEntry?: GqlFilesystemEntry | null;
  filesystemEntries?: GqlFilesystemEntry[];
}

interface GqlSeasonFull {
  seasonNumber: number;
  state: string;
  isRequested: boolean;
  episodes?: GqlEpisodeFull[];
}

export interface GqlMediaItemFull {
  id: number;
  state: string;
  imdbId?: string | null;
  tmdbId?: string | null;
  tvdbId?: string | null;
  filesystemEntry?: GqlFilesystemEntry | null;
  filesystemEntries?: GqlFilesystemEntry[];
  seasons?: GqlSeasonFull[];
}

interface GqlEpisodeState {
  id: number;
  episodeNumber?: number | null;
  state: string;
}

interface GqlSeasonState {
  id: number;
  seasonNumber?: number | null;
  state: string;
  isRequested: boolean;
  episodes?: GqlEpisodeState[];
}

export interface GqlMediaItemStateTree {
  id: number;
  state: string;
  imdbId?: string | null;
  tmdbId?: string | null;
  tvdbId?: string | null;
  seasons?: GqlSeasonState[];
}

const MEDIA_ITEM_FULL_FIELDS = `
    id state imdbId tmdbId tvdbId
    filesystemEntry {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    filesystemEntries {
        id fileSize originalFilename downloadUrl
        provider providerDownloadId path plugin rankingProfileName mediaMetadata
    }
    seasons {
        seasonNumber state isRequested
        episodes {
            episodeNumber state
            filesystemEntry {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
            filesystemEntries {
                id fileSize originalFilename downloadUrl
                provider providerDownloadId path plugin rankingProfileName mediaMetadata
            }
        }
    }
`;

const RAW_FILESYSTEM_ENTRY_FIELDS = `
    id fileSize createdAt updatedAt mediaItemId entryType path
    originalFilename downloadUrl plugin provider providerDownloadId
    libraryProfiles mediaMetadata language parentOriginalFilename subtitleContent
    fileHash videoFileSize opensubtitlesId streamId resolution rankingProfileName
`;

const RAW_MEDIA_ITEM_FULL_FIELDS = `
    id title fullTitle state imdbId tmdbId tvdbId posterPath
    createdAt updatedAt indexedAt scrapedAt scrapedTimes
    aliases network country language isAnime airedAt year genres rating contentRating
    failedAttempts itemType isRequested showStatus seasonNumber isSpecial parentId
    episodeNumber absoluteNumber runtime itemRequestId activeStreamId
    filesystemEntry {
        ${RAW_FILESYSTEM_ENTRY_FIELDS}
    }
    filesystemEntries {
        ${RAW_FILESYSTEM_ENTRY_FIELDS}
    }
    seasons {
        id title seasonNumber isSpecial parentId createdAt updatedAt indexedAt scrapedAt
        scrapedTimes failedAttempts itemType state isRequested
        episodes {
            id title episodeNumber absoluteNumber runtime airedAt parentId createdAt updatedAt
            indexedAt scrapedAt scrapedTimes failedAttempts itemType state isRequested
            filesystemEntry {
                ${RAW_FILESYSTEM_ENTRY_FIELDS}
            }
            filesystemEntries {
                ${RAW_FILESYSTEM_ENTRY_FIELDS}
            }
        }
    }
`;

const MEDIA_ITEM_STATE_FIELDS = `
    id state imdbId tmdbId tvdbId
    seasons {
        id seasonNumber state isRequested
        episodes {
            id episodeNumber state
        }
    }
`;

export const MEDIA_ITEM_FULL_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const MEDIA_ITEM_FULL_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const RAW_RIVEN_DATA_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemFullByTmdb(tmdbId: $tmdbId) {
        ${RAW_MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const RAW_RIVEN_DATA_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemFullByTvdb(tvdbId: $tvdbId) {
        ${RAW_MEDIA_ITEM_FULL_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_UPDATES_BY_TMDB_SUBSCRIPTION = `subscription($tmdbId: String!) {
    mediaItemStateUpdatesByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_UPDATES_BY_TVDB_SUBSCRIPTION = `subscription($tvdbId: String!) {
    mediaItemStateUpdatesByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

// ── New pub-sub subscriptions ──

export interface GqlIndexedShow {
  id: number;
  tvdbId?: string | null;
  tmdbId?: string | null;
  imdbId?: string | null;
  state: string;
}

/** Fires whenever a movie item request is created. */
export const MOVIE_REQUESTED_SUBSCRIPTION = `subscription {
    movieRequested {
        id tmdbId imdbId requestType state
    }
}`;

/** Fires whenever a show item request is created. */
export const SHOW_REQUESTED_SUBSCRIPTION = `subscription {
    showRequested {
        id tvdbId imdbId requestType state
    }
}`;

/** Fires whenever an existing show item request is updated (e.g. new seasons added). */
export const SHOW_REQUEST_UPDATED_SUBSCRIPTION = `subscription {
    showRequestUpdated {
        id tvdbId imdbId requestType state
    }
}`;

/** Fires whenever a show has been indexed (metadata + episode structure persisted). */
export const SHOW_INDEXED_SUBSCRIPTION = `subscription {
    showIndexed {
        id tvdbId tmdbId imdbId state
    }
}`;

export const MEDIA_ITEM_STATE_BY_TMDB_QUERY = `query($tmdbId: String!) {
    mediaItemStateByTmdb(tmdbId: $tmdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

export const MEDIA_ITEM_STATE_BY_TVDB_QUERY = `query($tvdbId: String!) {
    mediaItemStateByTvdb(tvdbId: $tvdbId) {
        ${MEDIA_ITEM_STATE_FIELDS}
    }
}`;

function mapFsEntry(entry: GqlFilesystemEntry): FilesystemEntry {
  return {
    ...(entry.id && { id: entry.id }),
    ...(entry.fileSize && { file_size: entry.fileSize }),
    ...(entry.originalFilename && {
      original_filename: entry.originalFilename,
    }),
    ...(entry.downloadUrl && { download_url: entry.downloadUrl }),
    ...(entry.provider && { provider: entry.provider }),
    ...(entry.providerDownloadId && {
      provider_download_id: entry.providerDownloadId,
    }),
    ...(entry.path && { path: entry.path }),
    ...(entry.plugin && { plugin: entry.plugin }),
    ...(entry.rankingProfileName && {
      ranking_profile_name: entry.rankingProfileName,
    }),
    ...(entry.mediaMetadata ? { media_metadata: entry.mediaMetadata } : {}),
  };
}

export function mapMediaItemFull(
  raw: GqlMediaItemFull | null | undefined,
): RivenMediaItem | null {
  if (!raw) {
    return null;
  }

  const seasons =
    raw.seasons?.map((season) => {
      const episodes =
        season.episodes?.map((episode) => ({
          episode_number: episode.episodeNumber,
          state: episode.state,
          ...(episode.filesystemEntry && {
            media_metadata: episode.filesystemEntry
              .mediaMetadata as MediaMetadata,
          }),
          ...(episode.filesystemEntry && {
            filesystem_entry: mapFsEntry(episode.filesystemEntry),
          }),
          filesystem_entries: episode.filesystemEntries?.map(mapFsEntry) ?? [],
        })) ?? [];

      return {
        season_number: season.seasonNumber,
        state: season.state,
        is_requested: season.isRequested,
        episodes,
      };
    }) ?? [];

  return {
    id: raw.id,
    state: raw.state,
    ...(raw.imdbId && { imdb_id: raw.imdbId }),
    ...(raw.tmdbId && { tmdb_id: raw.tmdbId }),
    ...(raw.tvdbId && { tvdb_id: raw.tvdbId }),
    ...(raw.filesystemEntry && {
      media_metadata: raw.filesystemEntry.mediaMetadata as MediaMetadata,
    }),
    ...(raw.filesystemEntry && {
      filesystem_entry: mapFsEntry(raw.filesystemEntry),
    }),
    ...(raw.filesystemEntries && {
      filesystem_entries: raw.filesystemEntries.map(mapFsEntry),
    }),
    seasons,
  };
}

export function mapMediaItemStateTree(
  raw: GqlMediaItemStateTree | null | undefined,
): RivenMediaItem | null {
  if (!raw) {
    return null;
  }

  const seasons =
    raw.seasons?.map((season) => {
      const episodes =
        season.episodes?.map((episode) => ({
          episode_number: episode.episodeNumber ?? 0,
          state: episode.state,
        })) ?? [];

      return {
        season_number: season.seasonNumber ?? 0,
        state: season.state,
        is_requested: season.isRequested,
        episodes,
      };
    }) ?? [];

  return {
    id: raw.id,
    state: raw.state,
    seasons,
    ...(raw.imdbId && { imdb_id: raw.imdbId }),
    ...(raw.tmdbId && { tmdb_id: raw.tmdbId }),
    ...(raw.tvdbId && { tvdb_id: raw.tvdbId }),
  };
}
