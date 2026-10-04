import { fly } from "@/components/_animations/fly";
import { RatingsRow } from "@/components/media/ratings-row/ratings-row";
import { StatusBadge } from "@/components/media/status-badge/status-badge";
import { PortraitCard } from "@/components/portrait-card/portrait-card";

import { cn } from "cn";
import React from "react";

import { ItemActionToolbar } from "./item-action-toolbar";

import type { IndexerData } from "@/app/_types/__generated__/graphql";

interface ItemOverviewProps {
  data: IndexerData;
}

export function ItemOverview({ data }: ItemOverviewProps) {
  const details = [
    data.year,
    data.runtime,
    data.language?.toUpperCase(),
    data.certification,
    // data.status,
  ].filter(Boolean);

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const handleRequestSuccess = () => {
    /* empty */
  };

  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const handleActionSuccess = () => {
    /* empty */
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] lg:gap-6">
      <div
        className={cn(
          "hidden lg:mx-0 lg:block delay-50 animation-duration-400",
          fly,
        )}
      >
        <PortraitCard
          title={data.title}
          image={data.posterUrl}
          className="group w-48 rounded-xl shadow-2xl lg:w-64"
          showContent={false}
        />
      </div>
      <div className="flex flex-col gap-5">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 delay-100 animation-duration-400",
            fly,
          )}
        >
          <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
            {data.title}
          </h1>
          {/* <StatusBadge
            className="px-3 py-1.5 text-sm font-medium inline-block h-8"
            state={data.mediaDetails.state}
            large
          />
          {data.mediaDetails.totalFileCount > 0 && (
            <span className="text-muted-foreground border-border rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums">
              {data.mediaDetails.completedFileCount}/
              {data.mediaDetails.totalFileCount} files
            </span>
          )} */}
        </div>

        <ItemActionToolbar
          title={data.title}
          mediaType={data.type}
          externalId={data.id}
          // seasons={data.seasons}
          seasons={[]}
          // {riven}
          // {rivenId}
          // {rivenPending}
          onRequestSuccess={handleRequestSuccess}
          onActionSuccess={handleActionSuccess}
          riven={{} as never}
          rivenId={null}
          rivenPending={false}
          // bind:rawDataOpen
          // {rawRivenLoading}
          // {rawRivenError}
          // {rawRivenJson}
        />

        <div
          className={cn(
            "text-muted-foreground flex items-center gap-x-2.5 text-sm animation-duration-400 delay-200",
            fly,
          )}
        >
          {details.map((detail, i) => (
            <React.Fragment key={detail}>
              <span>{detail}</span>
              {i < details.length - 1 && <span className="text-border">•</span>}
            </React.Fragment>
          ))}
        </div>
        {data.genres.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 animation-duration-400 delay-250",
              fly,
            )}
          >
            {data.genres.map((genre) => (
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
            "text-muted-foreground max-w-4xl text-base leading-relaxed animation-duration-400 delay-350",
            fly,
          )}
        >
          {data.overview}
        </p>
      </div>
    </div>
  );
}
