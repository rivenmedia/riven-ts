import { fly } from "@/components/_animations/fly";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/_ui/carousel";
import { BackdropBackground } from "@/components/media/backdrop-background/backdrop-background";
import { FileInformationPanel } from "@/components/media/file-information-panel/file-information-panel";
import { HeroBanner } from "@/components/media/hero-banner/hero-banner";
import { RatingsRow } from "@/components/media/ratings-row/ratings-row";
import { SectionHeading } from "@/components/media/section-heading/section-heading";
import { StatusBadge } from "@/components/media/status-badge/status-badge";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { cn } from "cn";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { ItemActionToolbar } from "./_components/item-action-toolbar";
import { MediaCarousel } from "./_components/media-carousel";
import { SeasonList } from "./_components/season-list";

import type { SeasonData } from "./_components/season-selector";
import type {
  MediaEntry,
  MediaMetadata,
} from "@/app/_types/__generated__/graphql";
import type { TypedDocumentNode } from "@apollo/client";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { MediaItemContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

export const GET_MEDIA_ITEM: TypedDocumentNode<
  {
    mediaDetails: {
      totalFileCount: number;
      completedFileCount: number;
      details: {
        id: string;
        backdropPath: string;
        logo: string | null;
        trailer: {
          id?: string | number;
          name: string;
          site: string | null;
          key: string;
          url?: string | null;
        };
        title: string;
        posterPath: string;
        overview: string;
        recommendations: Pick<
          MediaItem,
          "id" | "title" | "posterPath" | "type" | "year"
        >[];
        similar: Pick<
          MediaItem,
          "id" | "title" | "posterPath" | "type" | "year"
        >[];
        genres: { id: string; name: string }[];
        cast: {
          id: string;
          name: string;
          character: string;
          profilePath: string;
        }[];
        year: number;
        formattedRuntime: string;
        originalLanguage: string;
        certification: MediaItemContentRating;
        status: string;
        seasons: SeasonData[] | null;
      };
      type: MediaItemType;
      state: MediaItemState;
      filesystemEntries: Omit<MediaEntry, "mediaItem">[];
      mediaMetadata: MediaMetadata | null;
    };
  },
  { id: string }
> = gql`
  query GetMediaItem($id: ID!) {
    mediaDetails(id: $id) {
      totalFileCount
      completedFileCount
      details {
        id
        backdropPath
        logo
        trailer {
          id
          name
          site
          key
          url
        }
        title
        posterPath
        overview
        recommendations {
          id
          title
          posterPath
          type
          year
        }
        similar {
          id
          title
          posterPath
          type
          year
        }
        genres
        cast
        year
        formattedRuntime
        originalLanguage
        certification
        status
        seasons {
          id
          name
          seasonNumber
          episodeCount
          completedCount
        }
      }
      type
      state
      filesystemEntries {
        id
        fileSize {
          size
          units
        }
        createdAt
        type
        originalFilename
        plugin
      }
      mediaMetadata
    }
  }
`;

export default function MediaDetailsPage() {
  const { data } = useSuspenseQuery(GET_MEDIA_ITEM, {
    variables: {
      id: "some-id", // Replace with the actual ID
    },
  });

  const details = [
    data.mediaDetails.details.year,
    data.mediaDetails.details.formattedRuntime,
    data.mediaDetails.details.originalLanguage.toUpperCase(),
    data.mediaDetails.details.certification,
    data.mediaDetails.details.status,
  ].filter(Boolean);

  const handleRequestSuccess = () => {};

  const handleActionSuccess = () => {};

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {data.mediaDetails.details.backdropPath && (
        <BackdropBackground
          image={
            <Image
              alt=""
              className={cn(
                "h-full w-full object-cover opacity-30 blur-3xl transition-opacity duration-1000",
                fly,
              )}
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
            <div
              className={cn(
                "hidden lg:mx-0 lg:block delay-50 duration-400",
                fly,
              )}
            >
              <PortraitCard
                title={data.mediaDetails.details.title}
                image={data.mediaDetails.details.posterPath}
                className="group w-48 rounded-xl shadow-2xl lg:w-64"
                showContent={false}
              />
            </div>
            <div className="flex flex-col gap-5">
              <div
                className={cn(
                  "flex flex-wrap items-center gap-3 delay-100 duration-400",
                  fly,
                )}
              >
                <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                  {data.mediaDetails.details.title}
                </h1>
                <StatusBadge
                  className="px-3 py-1.5 text-sm font-medium inline-block h-8"
                  state={data.mediaDetails.state}
                  large
                />
                {data.mediaDetails.totalFileCount > 0 && (
                  <span className="text-muted-foreground border-border rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums">
                    {data.mediaDetails.completedFileCount}/
                    {data.mediaDetails.totalFileCount} files
                  </span>
                )}
              </div>

              <ItemActionToolbar
                title={data.mediaDetails.details.title}
                mediaType={data.mediaDetails.type}
                externalId={data.mediaDetails.details.id}
                seasons={data.mediaDetails.details.seasons}
                // {riven}
                // {rivenId}
                // {rivenPending}
                onRequestSuccess={handleRequestSuccess}
                onActionSuccess={handleActionSuccess}
                // bind:rawDataOpen
                // {rawRivenLoading}
                // {rawRivenError}
                // {rawRivenJson}
              />

              <div
                className={cn(
                  "text-muted-foreground flex items-center gap-x-2.5 text-sm duration-400 delay-200",
                  fly,
                )}
              >
                {details.map((detail, i) => (
                  <React.Fragment key={detail}>
                    <span>{detail}</span>
                    {i < details.length - 1 && (
                      <span className="text-border">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {data.mediaDetails.details.genres.length > 0 && (
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 duration-400 delay-250",
                    fly,
                  )}
                >
                  {data.mediaDetails.details.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="border-border bg-muted/50 text-muted-foreground rounded-xl border px-3 py-1 text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              <RatingsRow
                scores={[
                  {
                    name: "IMDb",
                    image: "imdb.svg",
                    score: "7.6",
                    url: "",
                  },
                  {
                    name: "TMDb",
                    image: "tmdb.svg",
                    score: "9.2",
                    url: "",
                  },
                ]}
                loading={false}
              />
              <p
                className={cn(
                  "text-muted-foreground max-w-4xl text-base leading-relaxed duration-400 delay-350",
                  fly,
                )}
              >
                {data.mediaDetails.details.overview}
              </p>
            </div>
          </div>
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
                className={cn("mt-8 md:mt-12 duration-400 delay-450", fly)}
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
            <section
              className={cn("mt-8 md:mt-12 duration-400 delay-550", fly)}
            >
              <SectionHeading title="Cast" />
              <Carousel opts={{ dragFree: true, slidesToScroll: "auto" }}>
                <CarouselContent className="-ml-3">
                  {data.mediaDetails.details.cast.map((member) => (
                    <CarouselItem key={member.id} className="basis-auto pl-3">
                      <PortraitCard
                        title={member.name}
                        subtitle={member.character}
                        image={member.profilePath}
                        className="w-32 md:w-36 lg:w-40"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </section>
          )}
          <section className={cn("mt-8 md:mt-12 duration-400 delay-600", fly)}>
            <div className="flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12">
              {/* <MoreDetailsPanel
                budget={
                  data.mediaDetails?.type === "movie"
                    ? data.mediaDetails.details.budget
                    : undefined
                }
                revenue={
                  data.mediaDetails?.type === "movie"
                    ? data.mediaDetails.details.revenue
                    : undefined
                }
                originCountry={data.mediaDetails?.details.origin_country}
                spokenLanguages={data.mediaDetails?.details.spoken_languages}
                productionCompanies={
                  data.mediaDetails?.details.production_companies
                }
                homepage={data.mediaDetails?.details.homepage}
                imdbId={data.mediaDetails?.details.imdb_id}
                // {externalLinks}
              /> */}

              {data.mediaDetails.type === "movie" &&
                data.mediaDetails.filesystemEntries.length > 0 && (
                  <FileInformationPanel
                    entries={data.mediaDetails.filesystemEntries}
                    fallbackMediaMetadata={data.mediaDetails.mediaMetadata}
                    onDeleteEntry={() => {}}
                  />
                )}
            </div>
          </section>
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
