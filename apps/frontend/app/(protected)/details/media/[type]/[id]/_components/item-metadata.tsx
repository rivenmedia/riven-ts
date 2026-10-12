import { cn } from "cn";

import { fly } from "#components/_animations/fly.ts";
// import { FileInformationPanel } from "#components/media/file-information-panel/file-information-panel.tsx";

import { MoreDetailsPanel } from "./more-details-panel";

import type { IndexerData } from "#app/_types/__generated__/graphql.ts";

interface ItemMetadataProps {
  data: Pick<
    IndexerData,
    | "budget"
    | "revenue"
    | "originCountry"
    | "spokenLanguages"
    | "productionCompanies"
    | "homepage"
    | "imdbId"
    | "type"
  >;
}

export function ItemMetadata({ data }: ItemMetadataProps) {
  return (
    <section
      className={cn("mt-8 md:mt-12 animation-duration-400 delay-600", fly)}
    >
      <div className="flex max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12">
        <MoreDetailsPanel
          budget={data.budget ?? null}
          revenue={data.revenue ?? null}
          originCountry={data.originCountry ?? []}
          spokenLanguages={data.spokenLanguages ?? []}
          productionCompanies={data.productionCompanies ?? []}
          homepage={data.homepage ?? null}
          imdbId={data.imdbId ?? null}
          externalLinks={[]}
        />
        {
          // data.mediaDetails.type === "movie" &&
          //   data.mediaDetails.filesystemEntries.length > 0 && (
          //     <FileInformationPanel
          //       entries={data.mediaDetails.filesystemEntries}
          //       fallbackMediaMetadata={data.mediaDetails.mediaMetadata}
          //       onDeleteEntry={() => {
          //         /* empty */
          //       }}
          //     />
          //   )
        }
      </div>
    </section>
  );
}
