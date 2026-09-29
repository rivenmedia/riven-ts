import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { NowPlaying } from "@/components/now-playing/now-playing";
import { NowPlayingSkeleton } from "@/components/now-playing/now-playing-skeleton";
import { query } from "@/lib/graphql/client";

import { cacheLife } from "next/cache";
import { Suspense } from "react";

import { GET_TMDB_NOW_PLAYING } from "./_queries/get-tmdb-now-playing.query";

async function TMDBNowPlayingLoader(
  props: Omit<React.ComponentProps<typeof NowPlaying>, "data">,
) {
  "use cache";

  cacheLife("hours");

  const { data } = await query({
    query: GET_TMDB_NOW_PLAYING,
    variables: {
      locale: "en-US",
    },
    errorPolicy: "ignore",
  });

  if (!data?.tmdbNowPlaying) {
    throw new Error("No now playing data available");
  }

  return <NowPlaying {...props} data={data.tmdbNowPlaying} />;
}

export function TMDBNowPlaying(
  props: Omit<React.ComponentProps<typeof NowPlaying>, "data">,
) {
  return (
    <ErrorFallback
      message="Unable to load what's playing right now."
      className={props.heightClass ?? ""}
    >
      <Suspense
        fallback={<NowPlayingSkeleton heightClass={props.heightClass ?? ""} />}
      >
        <TMDBNowPlayingLoader heightClass={props.heightClass ?? ""} />
      </Suspense>
    </ErrorFallback>
  );
}
