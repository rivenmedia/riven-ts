import { client, gql } from "$lib/graphql";
import { error } from "@sveltejs/kit";

import type { PageLoad } from "./$types.js";

const MEDIA_ITEM_DETAIL = gql`
  query MediaItemDetail($id: ID!) {
    mediaItemById(id: $id) {
      __typename
      ... on Movie {
        id
        title
        fullTitle
        year
        imdbId
        posterPath
        network
        country
        language
        releaseDate
        genres
        rating
        state
        type
        createdAt
        updatedAt
        indexedAt
        scrapedAt
        scrapedTimes
        filesystemEntries {
          id
          path
          size
          quality
        }
        streams {
          id
          infoHash
          title
          size
          seeders
          leechers
        }
      }
      ... on Show {
        id
        title
        fullTitle
        year
        imdbId
        posterPath
        network
        country
        language
        releaseDate
        genres
        rating
        state
        type
        createdAt
        updatedAt
        indexedAt
        scrapedAt
        scrapedTimes
        seasons {
          id
          number
          episodes {
            id
            number
            title
          }
        }
        filesystemEntries {
          id
          path
          size
          quality
        }
      }
      ... on Episode {
        id
        title
        fullTitle
        year
        number
        state
        type
        posterPath
        filesystemEntries {
          id
          path
          size
          quality
        }
      }
    }
  }
`;

export interface FilesystemEntryRef {
  id: string;
  path?: string | null;
  size?: number | null;
  quality?: string | null;
}

export interface StreamRef {
  id: string;
  infoHash?: string | null;
  title?: string | null;
  size?: number | null;
  seeders?: number | null;
  leechers?: number | null;
}

export interface EpisodeRef {
  id: string;
  number?: number | null;
  title?: string | null;
}

export interface SeasonRef {
  id: string;
  number?: number | null;
  episodes?: EpisodeRef[] | null;
}

export interface MediaItemDetail {
  __typename?: string;
  id: string;
  title: string;
  fullTitle?: string | null;
  year?: number | null;
  imdbId?: string | null;
  posterPath?: string | null;
  network?: string | null;
  country?: string | null;
  language?: string | null;
  releaseDate?: string | null;
  genres?: string[] | null;
  rating?: number | null;
  state?: string | null;
  type?: string | null;
  number?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  indexedAt?: string | null;
  scrapedAt?: string | null;
  scrapedTimes?: number | null;
  filesystemEntries?: FilesystemEntryRef[] | null;
  streams?: StreamRef[] | null;
  seasons?: SeasonRef[] | null;
}

export interface DetailPageData {
  item: MediaItemDetail | null;
  error: string | null;
}

export const load: PageLoad = async ({ params }): Promise<DetailPageData> => {
  if (!params.id) {
    // SvelteKit's `error()` returns an HttpError that must be thrown;
    // ESLint's only-throw-error rule cannot see that through the helper.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw error(404, "Missing id");
  }

  try {
    const { data } = await client.query<{ mediaItemById: MediaItemDetail }>({
      query: MEDIA_ITEM_DETAIL,
      variables: { id: params.id },
      fetchPolicy: "network-only",
    });
    if (!data?.mediaItemById) {
      return { item: null, error: "Not found" };
    }
    return { item: data.mediaItemById, error: null };
  } catch (err) {
    return {
      item: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
