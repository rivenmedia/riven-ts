import { cn } from "cn";
import { io } from "next/cache";

import { fly } from "#components/_animations/fly.ts";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_REQUEST_ACTIONS } from "./_queries/get-item-request-actions.query.ts";
import { DeleteItemAction } from "./actions/delete-item/delete-item-action.tsx";
import { PauseItemAction } from "./actions/pause-item/pause-item-action.tsx";
import { RequestMovieAction } from "./actions/request-item/request-movie-action.tsx";
import { RequestShowAction } from "./actions/request-item/request-show-action.tsx";
import { ResetItemAction } from "./actions/reset-item/reset-item-action.tsx";
import { ResumeItemAction } from "./actions/resume-item/resume-item-action.tsx";
import { RetryItemAction } from "./actions/retry-item/retry-item-action.tsx";

import type { SeasonData } from "./actions/request-item/_components/season-selector.tsx";
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

  const availableActions = new Set<ItemRequestAction>(
    data?.itemRequestByExternalIds?.availableActions ?? [
      mediaType === "movie" ? "request_single" : "request_multiple",
    ],
  );

  const itemRequestId = data?.itemRequestByExternalIds?.id ?? null;
  const primaryMediaItemId =
    data?.itemRequestByExternalIds?.primaryMediaItem?.id ?? null;

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
      {availableActions.has("reset") && primaryMediaItemId && (
        <ResetItemAction mediaItemId={primaryMediaItemId} title={title} />
      )}
      {availableActions.has("retry") && primaryMediaItemId && (
        <RetryItemAction mediaItemId={primaryMediaItemId} title={title} />
      )}
      {availableActions.has("resume") && primaryMediaItemId && (
        <ResumeItemAction mediaItemId={primaryMediaItemId} title={title} />
      )}
      {availableActions.has("pause") && primaryMediaItemId && (
        <PauseItemAction mediaItemId={primaryMediaItemId} title={title} />
      )}
      {availableActions.has("delete") && itemRequestId && (
        <DeleteItemAction itemRequestId={itemRequestId} title={title} />
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
