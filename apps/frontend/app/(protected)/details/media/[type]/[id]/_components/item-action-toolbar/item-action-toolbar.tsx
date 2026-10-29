import { cn } from "cn";
import { io } from "next/cache";

import { fly } from "#components/_animations/fly.ts";
import { query } from "#lib/graphql/client.ts";

import { fetchItemSeasons } from "../item-seasons/_data-access/fetch-item-seasons.ts";
import { RefreshOnItemRequestChange } from "./_components/refresh-on-item-request-change.tsx";
import { GET_MEDIA_ITEM_ACTIONS } from "./_queries/get-media-item-actions.query.ts";
import { ConfirmItemAction } from "./actions/_components/confirm-item-action.tsx";
import { RequestMovieAction } from "./actions/request-item/request-movie-action.tsx";
import { RequestShowAction } from "./actions/request-item/request-show-action.tsx";
import { confirmItemActions } from "./confirm-item-actions.tsx";

import type { MediaItemType } from "#app/_types/__generated__/graphql.ts";
import type { MediaItemAction } from "@repo/util-plugin-sdk/dto/enums/media-item-action.enum";

type ItemActionToolbarProps = {
  title: string;
  externalId: string;
  mediaType: MediaItemType;
  episodeNumber?: number;
  seasonNumber?: number;
} & (
  | {
      mediaType: "season";
      seasonNumber: number;
    }
  | {
      mediaType: "episode";
      seasonNumber: number;
      episodeNumber: number;
    }
  | {
      mediaType: "movie" | "show";
      episodeNumber?: never;
      seasonNumber?: never;
    }
);

export async function ItemActionToolbar({
  externalId,
  mediaType,
  episodeNumber,
  seasonNumber,
  title,
}: ItemActionToolbarProps) {
  await io();

  const externalIds =
    mediaType === "movie" ? { tmdbId: externalId } : { tvdbId: externalId };

  const { data } = await query({
    query: GET_MEDIA_ITEM_ACTIONS,
    variables: {
      type: mediaType,
      ...(episodeNumber === undefined ? {} : { episodeNumber }),
      ...(seasonNumber === undefined ? {} : { seasonNumber }),
      ...externalIds,
    },
  });

  const availableActions = new Set<MediaItemAction>(
    data?.itemRequestByExternalIds?.mediaItem?.availableActions ?? [
      mediaType === "movie" ? "request_single" : "request_multiple",
    ],
  );

  const targetIds = {
    itemRequest: data?.itemRequestByExternalIds?.id,
    mediaItem: data?.itemRequestByExternalIds?.mediaItem?.id,
  };

  return (
    <>
      <RefreshOnItemRequestChange externalIds={externalIds} />
      {availableActions.size > 0 && (
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
            mediaType !== "movie" && (
              <RequestShowAction
                title={title}
                externalIds={externalIds}
                requestedSeasons={
                  new Set(data?.itemRequestByExternalIds?.seasons)
                }
                seasons={await fetchItemSeasons(externalId)}
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
      )}
    </>
  );
}
