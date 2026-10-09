import { gql } from "@apollo/client";

import type {
  GetTmdbNowPlayingQuery,
  GetTmdbNowPlayingQueryVariables,
} from "./get-tmdb-now-playing.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TMDB_NOW_PLAYING: TypedDocumentNode<
  GetTmdbNowPlayingQuery,
  GetTmdbNowPlayingQueryVariables
> = gql`
  query GetTmdbNowPlaying($locale: String!) {
    tmdbNowPlaying {
      id
      title
      overview
      backdropUrl
      genres {
        id
        name
      }
      releaseDate
      language
      voteAverage
      certification(locale: $locale)
      logo(width: 500) {
        aspectRatio
        height
        width
        url
      }
      ratings {
        tmdb {
          logo
          score
          url
        }
        imdb {
          logo
          score
          url
        }
        rottenTomatoes {
          logo
          score
          url
        }
      }
      type
    }
  }
`;
