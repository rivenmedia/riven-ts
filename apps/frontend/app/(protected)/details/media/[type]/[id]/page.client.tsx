import { fly } from "@/components/_animations/fly";
import { BackdropBackground } from "@/components/media/backdrop-background/backdrop-background";
import { HeroBanner } from "@/components/media/hero-banner/hero-banner";
import { SectionHeading } from "@/components/media/section-heading/section-heading";

import { cn } from "cn";
import Image from "next/image";

import { ItemCast } from "./_components/item-cast";
import { ItemMetadata } from "./_components/item-metadata";
import { ItemOverview } from "./_components/item-overview";
import { MediaCarousel } from "./_components/media-carousel";
import { SeasonList } from "./_components/season-list";

import type { GetMediaItemQuery } from "./_queries/get-media-item.query.typegen";

interface MediaDetailsPageProps {
  data: GetMediaItemQuery;
}

export function MediaDetailsPage({ data }: MediaDetailsPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {data.mediaDetails.details.backdropPath && (
        <BackdropBackground
          image={
            <Image
              alt=""
              className="h-full w-full object-cover starting:opacity-0 opacity-30 blur-3xl transition-opacity duration-1000 ease-[easeOutCubic]"
              src={data.mediaDetails.details.backdropPath}
              loading="lazy"
              fill
            />
          }
        />
      )}

      <div className="z-10 mx-auto flex h-full w-full max-w-600 flex-col">
        <HeroBanner
          backdropPath={data.mediaDetails.details.backdropPath}
          logo={data.mediaDetails.details.logo}
          trailer={data.mediaDetails.details.trailer}
        />

        <div className="px-8 pb-24 md:px-20 lg:px-24">
          <ItemOverview data={data} />
          {/* {#if data.mediaDetails?.type === "movie"}
                    {/* {@const movieDetails = data.mediaDetails.details} */}
          {/* {#if movieDetails.collection}
                        <section
                            className="mt-8 md:mt-12"
                            // in:fly|global={{ y: 20, duration: 400, delay: 400, easing: cubicOut }}
                            >
                            <SectionHeading title="Collection" />
                            <CollectionSheet
                                collectionId={movieDetails.collection.id}
                                collectionName={movieDetails.collection.name}
                                onRequested={handleRequestSuccess}>
                                {#snippet trigger({ props })}
                                    <button
                                        {...props}
                                        className="group border-border/50 relative block min-h-24 w-full overflow-hidden rounded-xl border text-left shadow-lg transition-all duration-300 md:min-h-36">
                                        <!-- Background Layer -->
                                        <div className="absolute inset-0">
                                            <img
                                                alt={movieDetails.collection?.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                src={movieDetails.collection?.backdrop_path}
                                                loading="lazy" />
                                            <div
                                                className="from-background/90 via-background/40 absolute inset-0 bg-linear-to-r to-transparent">
                                            </div>
                                        </div>

                                        <!-- Content Layer -->
                                        <div
                                            className="relative flex flex-col justify-center p-4 md:p-8">
                                            <span
                                                className="text-foreground text-xl font-black drop-shadow-lg md:text-3xl"
                                                >{movieDetails.collection?.name}</span>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-3 w-fit border bg-transparent backdrop-blur-md"
                                                >View</Button>
                                        </div>
                                    </button>
                                {/snippet}
                            </CollectionSheet>
                        </section>
                    {/if} */}
          {/* {/if} */}
          {data.mediaDetails.type !== "movie" &&
            data.mediaDetails.details.seasons &&
            data.mediaDetails.details.seasons.length > 0 && (
              <section
                className={cn(
                  "mt-8 md:mt-12 animation-duration-400 delay-450",
                  fly,
                )}
              >
                <SectionHeading title="Seasons" />
                <SeasonList seasons={data.mediaDetails.details.seasons} />
              </section>
            )}
          {/* {#if data.mediaDetails?.type === "tv" && data.mediaDetails?.details.episodes}
                    <section
                        className="mt-8 md:mt-12"
                        // in:fly|global={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}
                        >
                        <SectionHeading title="Episodes" />
                        <LiveEpisodes
                            episodes={data.mediaDetails.details.episodes}
                            {selectedSeason}
                            {selectedEpisode}
                            showTitle={data.mediaDetails.details.title}
                            stateByEpisodeNumber={selectedRivenEpisodesByNumber}
                            detailsByEpisodeNumber={selectedHydratedEpisodesByNumber}
                            {formatSize}
                            onDeleteFilesystemEntry={deleteFilesystemEntry} />
                    </section>
                {/if} */}
          {data.mediaDetails.details.cast.length > 0 && (
            <ItemCast data={data} />
          )}
          <ItemMetadata data={data} />
          {data.mediaDetails.details.recommendations.length > 0 && (
            <MediaCarousel
              items={data.mediaDetails.details.recommendations}
              title="Recommendations"
              delay={600}
            />
          )}
          {data.mediaDetails.details.similar.length > 0 && (
            <MediaCarousel
              items={data.mediaDetails.details.similar}
              title="Similar"
              delay={650}
            />
          )}
          {/* {#if data.mediaDetails?.details.trakt_recommendations?.length}{@render mediaCarousel(
                        data.mediaDetails.details.trakt_recommendations,
                        "More Like This",
                        700
                    )}{/if} */}
        </div>
      </div>
    </div>
  );
}
