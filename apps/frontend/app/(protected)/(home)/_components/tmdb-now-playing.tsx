import { NowPlaying } from "@/components/now-playing/now-playing";
import { NowPlayingSkeleton } from "@/components/now-playing/now-playing-skeleton";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Suspense } from "react";

import type {
  GetTmdbNowPlayingQuery,
  GetTmdbNowPlayingQueryVariables,
} from "./tmdb-now-playing.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TMDB_NOW_PLAYING: TypedDocumentNode<
  GetTmdbNowPlayingQuery,
  GetTmdbNowPlayingQueryVariables
> = gql`
  query GetTmdbNowPlaying {
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
      certification
      logoUrl
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

function TMDBNowPlayingInner(
  props: Omit<React.ComponentProps<typeof NowPlaying>, "data">,
) {
  const { data } = useSuspenseQuery(GET_TMDB_NOW_PLAYING);

  return <NowPlaying {...props} data={data.tmdbNowPlaying} />;
}

export function TMDBNowPlaying(
  props: Omit<React.ComponentProps<typeof NowPlaying>, "data">,
) {
  return (
    <Suspense
      fallback={<NowPlayingSkeleton heightClass={props.heightClass ?? ""} />}
    >
      <TMDBNowPlayingInner {...props} />
    </Suspense>
  );
}
