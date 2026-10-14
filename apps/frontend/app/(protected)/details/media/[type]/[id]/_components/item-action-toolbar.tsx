import { cn } from "cn";
import { Pause, Play, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import { fly } from "#components/_animations/fly.ts";

import { RequestMovieAction } from "./actions/request-item/request-movie-action.tsx";
import { RequestShowAction } from "./actions/request-item/request-show-action.tsx";
import { ItemAction } from "./item-action.tsx";

import type { MediaItem } from "#app/_types/__generated__/graphql.ts";
import type { SeasonData } from "./season-selector.tsx";

type ItemActionToolbarProps = {
  title: string;
  externalId: string;
  riven: MediaItem | undefined;
  rivenId: number | string | null | undefined;
  rivenPending: boolean;
} & (
  | {
      mediaType: "movie";
      seasons?: never;
    }
  | {
      mediaType: "show";
      seasons: SeasonData[];
    }
);

export function ItemActionToolbar({
  externalId,
  mediaType,
  riven,
  seasons,
  title,
}: ItemActionToolbarProps) {
  const rivenIds: never[] = [];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 animation-duration-400 delay-150",
        fly,
      )}
    >
      {mediaType === "movie" ? (
        <RequestMovieAction title={title} tmdbId={externalId} imdbId={null} />
      ) : (
        <RequestShowAction
          title={title}
          tvdbId={externalId}
          imdbId={null}
          requestedSeasons={new Set([1, 2])}
          seasons={seasons}
        />
      )}
      {/* {mediaType && !riven && !rivenPending && (
        <>
          <ItemManualScrape
            size="default"
            variant="secondary"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
            {title}
            itemId={null}
            externalId={externalId ?? ""}
            mediaType={mediaType ?? "movie"}
            {seasons}>
            <Search className="mr-1.5 h-4 w-4" />
            Manual Scrape
        </ItemManualScrape>
        </>
      )} */}
      {riven?.id != null && (
        <>
          <ItemAction
            kind="reset"
            size="default"
            variant="secondary"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
            title={title}
            ids={rivenIds}
            // onSuccess={onActionSuccess}
            buttonLabel="Reset"
            buttonIcon={<RotateCcw className="mr-1.5 h-4 w-4" />}
          />
          <ItemAction
            kind="retry"
            size="default"
            variant="secondary"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
            title={title}
            ids={rivenIds}
            // onSuccess={onActionSuccess}
            buttonLabel="Retry"
            buttonIcon={<RefreshCw className="mr-1.5 h-4 w-4" />}
          />

          {/* {mediaType !== "movie" && (
            <BaseRequestItemAction
              size="default"
              variant="secondary"
              className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary border bg-transparent px-4"
              title={title}
              ids={rivenIds}
              mediaType={mediaType as MediaItemType}
              externalId={externalId ?? ""}
              seasons={seasons}
              requestedSeasons={new Set([1, 2])}
              // onSuccess={onRequestSuccess}
              buttonLabel="Request More"
              buttonIcon={<Download className="mr-1.5 h-4 w-4" />}
            />
          )} */}

          {/* <ItemManualScrape
            size="default"
            variant="secondary"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
            {title}
            itemId={rivenId?.toString() ?? null}
            externalId={externalId ?? ""}
            mediaType={mediaType ?? "movie"}
            {seasons}>
            <Search className="mr-1.5 h-4 w-4" />
            Manual Scrape
        </ItemManualScrape> */}

          {riven.state !== "completed" &&
            (riven.state === "paused" ? (
              <ItemAction
                kind="resume"
                size="default"
                variant="secondary"
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                title={title}
                ids={rivenIds}
                buttonIcon={<Play className="mr-1.5 h-4 w-4" />}
                buttonLabel="Resume"
              />
            ) : (
              <ItemAction
                kind="pause"
                size="default"
                variant="secondary"
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
                title={title}
                ids={rivenIds}
                buttonIcon={<Pause className="mr-1.5 h-4 w-4" />}
                buttonLabel="Pause"
              />
            ))}

          <ItemAction
            kind="delete"
            size="default"
            variant="secondary"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive border bg-transparent px-4"
            title={title}
            ids={rivenIds}
            buttonIcon={<Trash2 className="mr-1.5 h-4 w-4" />}
            buttonLabel="Delete"
          />
        </>
      )}
    </div>
  );
}
