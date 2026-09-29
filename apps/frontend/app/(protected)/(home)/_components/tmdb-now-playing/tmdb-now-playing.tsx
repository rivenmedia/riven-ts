import { ErrorFallback } from "@/components/error-fallback/error-fallback";
import { NowPlaying } from "@/components/now-playing/now-playing";
import { NowPlayingSkeleton } from "@/components/now-playing/now-playing-skeleton";
import { query } from "@/lib/graphql/client";
import { resolveLocale } from "@/lib/utils/resolve-locale";

import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";

import { GET_TMDB_NOW_PLAYING } from "./_queries/get-tmdb-now-playing.query";

type TMDBNowPlayingProps = Omit<
  React.ComponentProps<typeof NowPlaying>,
  "data"
>;

/**
 * RSC which caches the localised TMDB Now Playing UI.
 */
async function TMDBNowPlayingLoader({
  locale,
  ...props
}: TMDBNowPlayingProps & {
  locale: string;
}) {
  "use cache";

  cacheLife("hours");

  const { data } = await query({
    query: GET_TMDB_NOW_PLAYING,
    variables: {
      locale,
    },
    errorPolicy: "ignore",
  });

  if (!data?.tmdbNowPlaying) {
    throw new Error("No now playing data available");
  }

  return <NowPlaying {...props} data={data.tmdbNowPlaying} />;
}

/**
 * RSC which resolves the user's locale and loads the TMDB Now Playing UI.
 */
async function TMDBNowPlayingContent(props: TMDBNowPlayingProps) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = resolveLocale(acceptLanguage);

  return <TMDBNowPlayingLoader {...props} locale={locale} />;
}

export function TMDBNowPlaying(props: TMDBNowPlayingProps) {
  return (
    <ErrorFallback
      message="Unable to load what's playing right now."
      className={props.heightClass ?? ""}
    >
      <Suspense
        fallback={<NowPlayingSkeleton heightClass={props.heightClass ?? ""} />}
      >
        <TMDBNowPlayingContent {...props} />
      </Suspense>
    </ErrorFallback>
  );
}
