import { fly } from "@repo/util-ui/components/_animations/fly.ts";
import { CastMemberCarousel } from "@repo/util-ui/components/cast-member-carousel/cast-member-carousel.tsx";
import { ErrorFallback } from "@repo/util-ui/components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "@repo/util-ui/components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "@repo/util-ui/components/media/section-heading/section-heading.tsx";
import { query } from "@repo/util-ui/graphql/client.ts";
import { resolveLocale } from "@repo/util-ui/utilities/resolve-locale.ts";

import { cn } from "cn";
import { cacheLife } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";

import { GET_ITEM_CAST } from "./_queries/get-item-cast.query.ts";

interface ItemCastContentProps {
  id: string;
  locale: string;
}

async function ItemCastContent({ id, locale }: ItemCastContentProps) {
  "use cache";

  cacheLife("days");

  const { data } = await query({
    query: GET_ITEM_CAST,
    variables: {
      id,
      language: locale,
    },
  });

  if (!data?.tmdbItem.cast) {
    return null;
  }

  return <CastMemberCarousel cast={data.tmdbItem.cast} />;
}

interface ItemCastLoaderProps {
  id: string;
}

async function ItemCastLoader({ id }: ItemCastLoaderProps) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = resolveLocale(acceptLanguage);

  return <ItemCastContent id={id} locale={locale} />;
}

interface ItemCastProps {
  id: string;
}

export function ItemCast({ id }: ItemCastProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-550", fly)}
    >
      <SectionHeading title="Cast" />
      <ErrorFallback message="Unable to load cast information">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemCastLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
