import { cn } from "cn";
import { io } from "next/cache";
import { Suspense } from "react";

import { fly } from "#components/_animations/fly.ts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "#components/_ui/carousel.tsx";
import { ErrorFallback } from "#components/error-fallback/error-fallback.tsx";
import { ListCarouselSkeleton } from "#components/list-carousel/list-carousel-skeleton.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";
import { query } from "#lib/graphql/client.ts";

import { formatSeasonTitle } from "../../seasons/[seasonNumber]/_utilities/format-season-title.ts";
import { LiveSeasonCard } from "./_components/season-card/season-card.client.tsx";
import { SeasonCard } from "./_components/season-card/season-card.tsx";
import { fetchItemSeasons } from "./_data-access/fetch-item-seasons";
import { GET_ITEM_SEASON_STATES } from "./_queries/get-item-season-states.query.ts";

import type {
  SeasonCardProps,
  SeasonState,
} from "./_components/season-card/season-card.tsx";
import type { GetItemSeasonsQuery } from "./_queries/get-item-seasons.query.typegen.ts";

interface SeasonCarouselProps {
  showId: string;
  seasons: NonNullable<GetItemSeasonsQuery["tmdbItem"]["seasons"]>;
  /**
   * The states of the indexed seasons, keyed by season number.
   */
  seasonStates: Map<number, SeasonState & { id: string }>;
}

function SeasonCarousel({
  showId,
  seasons,
  seasonStates,
}: SeasonCarouselProps) {
  return (
    <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
      <CarouselContent>
        {seasons.map(({ episodes, id, number, posterUrl }) => {
          const seasonCardProps = {
            title: formatSeasonTitle(number),
            href: `/details/media/show/${showId}/seasons/${number.toString()}`,
            posterUrl,
            episodeCount: episodes.length,
          } as const satisfies SeasonCardProps;

          const seasonState = seasonStates.get(number);

          return (
            <CarouselItem key={id} className="basis-auto">
              {seasonState ? (
                <LiveSeasonCard
                  {...seasonCardProps}
                  id={seasonState.id}
                  initialSeason={seasonState}
                />
              ) : (
                <SeasonCard {...seasonCardProps} />
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}

interface ItemSeasonsLoaderProps {
  id: string;
}

async function ItemSeasonsLoader({ id }: ItemSeasonsLoaderProps) {
  await io();

  // The seasons are cached, so the indexed seasons' states are fetched separately to stay up to date
  const [seasons, { data, error }] = await Promise.all([
    fetchItemSeasons(id),
    query({
      query: GET_ITEM_SEASON_STATES,
      variables: { tvdbId: id },
    }),
  ]);

  if (error) {
    throw error;
  }

  if (!seasons) {
    return <p>No seasons found.</p>;
  }

  const show = data?.itemRequestByExternalIds?.primaryMediaItem;
  const seasonStates = new Map(
    show?.__typename === "Show"
      ? show.seasons.map((season) => [season.number, season])
      : [],
  );

  return (
    <SeasonCarousel showId={id} seasons={seasons} seasonStates={seasonStates} />
  );
}

interface ItemSeasonsProps {
  id: string;
}

export function ItemSeasons({ id }: ItemSeasonsProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-550", fly)}
    >
      <SectionHeading title="Seasons" />
      <ErrorFallback message="Unable to load seasons information">
        <Suspense fallback={<ListCarouselSkeleton />}>
          <ItemSeasonsLoader id={id} />
        </Suspense>
      </ErrorFallback>
    </section>
  );
}
