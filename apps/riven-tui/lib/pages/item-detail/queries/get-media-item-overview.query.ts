import { gql } from "@apollo/client";

import type {
  RivenTuiGetMediaItemOverviewQuery,
  RivenTuiGetMediaItemOverviewQueryVariables,
} from "./get-media-item-overview.query.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_MEDIA_ITEM_OVERVIEW: TypedDocumentNode<
  RivenTuiGetMediaItemOverviewQuery,
  RivenTuiGetMediaItemOverviewQueryVariables
> = gql`
  query RivenTuiGetMediaItemOverview($mediaItemId: ID!) {
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
        posterPath
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
