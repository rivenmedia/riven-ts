import { useSuspenseQuery } from "@apollo/client/react";
import { Text, useInput } from "ink";
import { Outlet, useNavigate, useParams } from "react-router";
import { z } from "zod";

import { useActionsMenuContext } from "../../ui/actions-menu/actions-menu-context.tsx";
import { ActionsMenu } from "../../ui/actions-menu/actions-menu.tsx";
import { MediaItemStateBadge } from "../../ui/media-item-state-badge.tsx";
import { PageWrapper } from "../../ui/page-wrapper/page-wrapper.tsx";
import { SuspenseBoundary } from "../../ui/suspense-boundary.tsx";
import { createAction } from "../../utilities/create-action.ts";
import { BLACKLIST_ACTIVE_STREAM } from "./queries/blacklist-active-stream.mutation.ts";
import { GET_MEDIA_ITEM } from "./queries/get-media-item.query.ts";
import { REMOVE_ITEM_REQUEST } from "./queries/remove-item-request.mutation.ts";
import { RESET_MEDIA_ITEM } from "./queries/reset-media-item.mutation.ts";
import { getActionsFor } from "./utilities/get-actions-for.ts";

import type { ActionTarget, ItemAction } from "../../types/actions.ts";

export function ItemDetailPageLayout() {
  const params = useParams<"id">();
  const id = z.string().parse(params.id);
  const navigate = useNavigate();

  const {
    data: { mediaItemById: item },
  } = useSuspenseQuery(GET_MEDIA_ITEM, {
    fetchPolicy: "network-only",
    variables: { mediaItemId: id },
  });

  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  useInput(
    (_input, key) => {
      if (key.escape) {
        void navigate(-1);
      }
    },
    { isActive: !isActionsMenuVisible },
  );

  const rawActions = [
    createAction(BLACKLIST_ACTIVE_STREAM, {
      appliesTo: ["Movie", "Show", "Season", "Episode"],
      id: "blacklist-active-stream",
      label: "Blacklist active stream",
      when: item.hasActiveStream,
      description:
        "Blacklist the currently active stream and search for a replacement.",
      variables: {
        mediaItemId: item.id,
      },
      buildResultMessageData: (target, result, error) => {
        if (error) {
          return {
            type: "error",
            message: `Error blacklisting active stream for ${target.title}: ${error.message}`,
          };
        }

        if (result?.error) {
          return {
            type: "error",
            message: `Error blacklisting active stream for ${target.title}: ${result.error.message}`,
          };
        }

        if (result?.data?.blacklistActiveStream) {
          return {
            type: "success",
            message: `Successfully blacklisted active stream for ${target.title}.`,
          };
        }

        return {
          type: "error",
          message: `Unknown error blacklisting active stream for ${target.title}.`,
        };
      },
    }),
    createAction(REMOVE_ITEM_REQUEST, {
      appliesTo: ["Movie", "Show"],
      id: "remove-request",
      label: "Remove request",
      description: "Remove the item request, halting further processing.",
      variables: {
        itemRequestId: item.itemRequest.id,
      },
      buildResultMessageData: (target, result, error) => {
        if (error) {
          return {
            type: "error",
            message: `Error removing request for ${target.title}: ${error.message}`,
          };
        }

        if (result?.error) {
          return {
            type: "error",
            message: `Error removing request for ${target.title}: ${result.error.message}`,
          };
        }

        if (result?.data?.removeItemRequest) {
          return {
            type: "success",
            message: `Successfully removed request for ${target.title}.`,
          };
        }

        return {
          type: "error",
          message: `Unknown error removing request for ${target.title}.`,
        };
      },
    }),
    createAction(RESET_MEDIA_ITEM, {
      appliesTo: ["Movie", "Show", "Season", "Episode"],
      id: "reset-media-item",
      label: "Reset media item",
      description:
        "Reset the media item to its original state, clearing streams and filesystem entries.",
      variables: {
        mediaItemId: item.id,
      },
      buildResultMessageData: (target, result, error) => {
        if (error) {
          return {
            type: "error",
            message: `Error resetting media item for ${target.title}: ${error.message}`,
          };
        }

        if (result?.error) {
          return {
            type: "error",
            message: `Error resetting media item for ${target.title}: ${result.error.message}`,
          };
        }

        if (result?.data?.resetMediaItem) {
          return {
            type: "success",
            message: `Successfully reset ${result.data.resetMediaItem.length.toString()} media item(s) for ${target.title}.`,
          };
        }

        return {
          type: "error",
          message: `Unknown error resetting media item for ${target.title}.`,
        };
      },
    }),
  ] satisfies readonly ItemAction[];

  const actions = getActionsFor(rawActions, item.__typename);
  const target = {
    id: item.id,
    title: item.fullTitle,
    type: item.__typename,
  } satisfies ActionTarget;

  return (
    <PageWrapper
      header={{
        title: `${item.fullTitle}${item.year ? ` (${item.year.toString()})` : ""} · ${item.__typename}`,
        content: <MediaItemStateBadge state={item.state} />,
      }}
      footer={<Text dimColor>[a]ctions · [r]efresh · [esc] back · [q]uit</Text>}
      tabs={{
        [`/item/${item.id}`]: {
          label: "Overview",
        },
        [`/item/${item.id}/children`]: {
          label: `Children (${item.childItemCount.toString()})`,
          isHidden: item.childItemCount === 0,
        },
        [`/item/${item.id}/files`]: {
          label: `Files (${item.mediaEntryCount.toString()})`,
          isHidden: item.mediaEntryCount === 0,
        },
        [`/item/${item.id}/subtitles`]: {
          label: `Subtitles (${item.subtitlesCount.toString()})`,
          isHidden: item.subtitlesCount === 0,
        },
        [`/item/${item.id}/streams`]: {
          label: `Streams (${item.streamCount.toString()})`,
          isHidden: item.streamCount === 0,
        },
        [`/item/${item.id}/active-stream`]: {
          label: "Active stream",
          isHidden: !item.hasActiveStream,
        },
        [`/item/${item.id}/processing-data`]: {
          label: "Processing data",
          isHidden: item.processorJobId === null,
        },
      }}
      actions={<ActionsMenu actions={actions} target={target} />}
    >
      <SuspenseBoundary>
        <Outlet context={{ id }} />
      </SuspenseBoundary>
    </PageWrapper>
  );
}
