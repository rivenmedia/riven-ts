import { Skeleton } from "@repo/util-ui/components/_ui/skeleton.tsx";
import { query } from "@repo/util-ui/graphql/client.ts";

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GET_MEDIA_ITEM } from "./_queries/get-media-item.query.ts";
import { MovieDetails } from "./movie-details.tsx";

import type {
  PluginPageProps,
  PluginPageRouteParams,
} from "@repo/util-plugin-sdk/ui";

type MoviePageProps = PluginPageProps<PluginPageRouteParams<"movie/[id]">>;

async function MovieDetailsLoader({ params }: Pick<MoviePageProps, "params">) {
  const { id } = await params;
  const { data } = await query({
    query: GET_MEDIA_ITEM,
    errorPolicy: "all",
    variables: {
      id,
    },
  });

  if (!data) {
    return notFound();
  }

  return <MovieDetails data={data.tmdbItem} />;
}

function MovieDetailsSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-600 flex-col">
        <div className="px-2 md:px-4">
          <Skeleton className="mb-6 h-[40vh] max-h-150 min-h-87.5 rounded-3xl md:mb-10" />
        </div>
        <div className="grid grid-cols-1 gap-4 px-8 md:px-20 lg:grid-cols-[auto_1fr] lg:gap-6 lg:px-24">
          <Skeleton className="hidden aspect-2/3 w-64 rounded-xl lg:block" />
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-2/3 lg:h-12" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MoviePage({ params }: MoviePageProps) {
  return (
    <Suspense fallback={<MovieDetailsSkeleton />}>
      <MovieDetailsLoader params={params} />
    </Suspense>
  );
}
