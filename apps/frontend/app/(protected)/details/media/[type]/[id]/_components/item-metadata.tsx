import { fly } from "@/components/_animations/fly";
import { FileInformationPanel } from "@/components/media/file-information-panel/file-information-panel";

import { cn } from "cn";

import type { GetMediaItemQuery } from "../_queries/get-media-item.query.typegen";

interface ItemMetadataProps {
  data: GetMediaItemQuery;
}

export function ItemMetadata({ data }: ItemMetadataProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-600", fly)}
    >
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
              onDeleteEntry={() => {
                /* empty */
              }}
            />
          )}
      </div>
    </section>
  );
}
