import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemQuery,
  RivenTuiGetMediaItemQueryVariables,
} from "./get-media-item.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM: TypedDocumentNode<
  RivenTuiGetMediaItemQuery,
  RivenTuiGetMediaItemQueryVariables
> = gql`
  query RivenTuiGetMediaItem($mediaItemId: ID!) {
    mediaItemById(id: $mediaItemId) {
      ... on MediaItem {
        id
        fullTitle
        title
        state
        year
        rating
        releaseDate
        genres
        network
        country
        language
        isAnime
        expectedFileCount
        scrapedAt
        scrapedTimes
        failedScrapeAttempts
        indexedAt
        streams {
          infoHash
        }
        blacklistedStreams {
          plugin
          provider
        }
        filesystemEntries {
          id
          type
        }
        subtitles {
          id
          language
        }
        itemRequest {
          id
        }
        imdbId
      }

      ... on Movie {
        tmdbId
        movieContentRating: contentRating
        runtime
      }

      ... on ShowLikeMediaItem {
        tvdbId
      }

      ... on Show {
        showContentRating: contentRating
        status
        seasons(includeUnrequestedSeasons: true) {
          id
          title
          number
          state
          totalEpisodes
        }
      }

      ... on Season {
        number
        totalEpisodes
        show {
          id
          title
        }
        episodes {
          id
          title
          number
          state
        }
      }

      ... on Episode {
        number
        absoluteNumber
        show {
          id
          title
        }
        season {
          id
          number
        }
      }
    }
  }
`;
