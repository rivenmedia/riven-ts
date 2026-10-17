import { cn } from "cn";
import { io } from "next/cache";

import { fly } from "#components/_animations/fly.ts";
import { query } from "#lib/graphql/client.ts";

import { GET_ITEM_REQUEST_ACTIONS } from "./_queries/get-item-request-actions.query.ts";
import { ConfirmItemAction } from "./actions/_components/confirm-item-action.tsx";
import { RequestMovieAction } from "./actions/request-item/request-movie-action.tsx";
import { RequestShowAction } from "./actions/request-item/request-show-action.tsx";
import { confirmItemActions } from "./confirm-item-actions.tsx";

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

  const externalIds =
    mediaType === "movie" ? { tmdbId: externalId } : { tvdbId: externalId };

  const { data } = await query({
    query: GET_ITEM_REQUEST_ACTIONS,
    variables: externalIds,
  });

  const availableActions = new Set<ItemRequestAction>(
    data?.itemRequestByExternalIds?.availableActions ?? [
      mediaType === "movie" ? "request_single" : "request_multiple",
    ],
  );

  const targetIds = {
    itemRequest: data?.itemRequestByExternalIds?.id,
    mediaItem: data?.itemRequestByExternalIds?.primaryMediaItem?.id,
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 animation-duration-400 delay-150",
        fly,
      )}
    >
      {availableActions.has("request_single") && mediaType === "movie" && (
        <RequestMovieAction title={title} externalIds={externalIds} />
      )}
      {(availableActions.has("request_multiple") ||
        availableActions.has("request_more")) &&
        mediaType === "show" && (
          <RequestShowAction
            title={title}
            externalIds={externalIds}
            requestedSeasons={new Set(data?.itemRequestByExternalIds?.seasons)}
            seasons={seasons}
          />
        )}
      {confirmItemActions.map(
        ({ availableAction, target, action, pendingLabel, ...props }) => {
          const targetId = targetIds[target];

          if (!availableActions.has(availableAction) || !targetId) {
            return null;
          }

          return (
            <ConfirmItemAction
              key={availableAction}
              action={action.bind(null, targetId)}
              title={`${pendingLabel} "${title}"`}
              {...props}
            />
          );
        },
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
