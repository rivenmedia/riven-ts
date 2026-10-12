import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "#components/_ui/skeleton.tsx";
import { query } from "#lib/graphql/client.ts";

import { GET_MEDIA_ITEM } from "./_queries/get-media-item.query.ts";
import { MediaDetailsPage as MediaDetailsPageClient } from "./page.client.tsx";

async function MediaDetails({
  params,
}: Pick<PageProps<"/details/media/[type]/[id]">, "params">) {
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

  return <MediaDetailsPageClient data={data.tmdbItem} />;
}

function MediaDetailsSkeleton() {
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

export default function MediaDetailsPage({
  params,
}: PageProps<"/details/media/[type]/[id]">) {
  return (
    <Suspense fallback={<MediaDetailsSkeleton />}>
      <MediaDetails params={params} />
    </Suspense>
  );
}
