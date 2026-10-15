import { cn } from "cn";
import { Pause, Play, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { io } from "next/cache";

import { fly } from "#components/_animations/fly.ts";
import { query } from "#lib/graphql/client.ts";

import { ItemAction } from "../item-action.tsx";
import { GET_ITEM_REQUEST_ACTIONS } from "./_queries/get-item-request-actions.query.ts";
import { RequestMovieAction } from "./actions/request-item/request-movie-action.tsx";
import { RequestShowAction } from "./actions/request-item/request-show-action.tsx";

import type { SeasonData } from "../season-selector.tsx";
import type { ItemRequestAction } from "@repo/util-plugin-sdk/dto/enums/item-request-action.enum";

type ItemActionToolbarProps = {
  title: string;
  externalId: string;
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

export async function ItemActionToolbar({
  externalId,
  mediaType,
  seasons,
  title,
}: ItemActionToolbarProps) {
  await io();

  const { data } = await query({
    query: GET_ITEM_REQUEST_ACTIONS,
    variables: {
      tmdbId: mediaType === "movie" ? externalId : null,
      tvdbId: mediaType === "show" ? externalId : null,
    },
  });

  const itemRequestId = data?.itemRequestByExternalIds?.id ?? null;
  const availableActions = new Set<ItemRequestAction>(
    data?.itemRequestByExternalIds?.availableActions ?? [
      mediaType === "movie" ? "request_single" : "request_multiple",
    ],
  );

  const rivenIds: never[] = [];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 animation-duration-400 delay-150",
        fly,
      )}
    >
      {availableActions.has("request_single") && mediaType === "movie" && (
        <RequestMovieAction title={title} tmdbId={externalId} imdbId={null} />
      )}
      {availableActions.has("request_multiple") && mediaType === "show" && (
        <RequestShowAction
          title={title}
          tvdbId={externalId}
          imdbId={null}
          requestedSeasons={new Set(data?.itemRequestByExternalIds?.seasons)}
          seasons={seasons}
        />
      )}
      {availableActions.has("reset") && (
        <ItemAction
          kind="reset"
          size="default"
          variant="secondary"
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
          title={title}
          ids={[itemRequestId]}
          buttonLabel="Reset"
          buttonIcon={<RotateCcw className="mr-1.5 h-4 w-4" />}
        />
      )}
      {availableActions.has("retry") && (
        <ItemAction
          kind="retry"
          size="default"
          variant="secondary"
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground border bg-transparent px-4"
          title={title}
          ids={rivenIds}
          buttonLabel="Retry"
          buttonIcon={<RefreshCw className="mr-1.5 h-4 w-4" />}
        />
      )}
      {availableActions.has("resume") && (
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
      )}
      {availableActions.has("pause") && (
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
      )}
      {availableActions.has("delete") && (
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
      )}
      {availableActions.has("manual_scrape") && (
        <>
          <button disabled type="button">
            Manual Scrape
          </button>
          {/* <ItemManualScrape
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
          </ItemManualScrape> */}
        </>
      )}
    </div>
  );
}
