import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import Link from "ink-link";
import Image from "ink-picture";
import { useParams } from "react-router";
import { z } from "zod";

import { useActionsMenuContext } from "../../ui/actions-menu/actions-menu-context.tsx";
import { ActionsMenu } from "../../ui/actions-menu/actions-menu.tsx";
import { PageWrapper } from "../../ui/page-wrapper.tsx";
import { SelectList } from "../../ui/select-list.tsx";
import { SelectableRow } from "../../ui/selectable-row.tsx";
import { StateBadge } from "../../ui/state-badge.tsx";
import { createAction } from "../../utilities/create-action.ts";
import { DetailRow } from "./components/detail-row.tsx";
import { BLACKLIST_ACTIVE_STREAM } from "./queries/blacklist-active-stream.mutation.ts";
import { GET_MEDIA_ITEM } from "./queries/get-media-item.query.ts";
import { REMOVE_ITEM_REQUEST } from "./queries/remove-item-request.mutation.ts";
import { formatDate } from "./utilities/format-date.ts";
import { formatList } from "./utilities/format-list.ts";
import { getActionsFor } from "./utilities/get-actions-for.ts";
import { getChildren } from "./utilities/get-children.ts";
import { getContentRating } from "./utilities/get-content-rating.ts";

import type { ActionTarget, ItemAction } from "../../types/actions.ts";

export interface ItemDetailScreenProps {
  onBack: () => void;
  onSelectChild: (id: string) => void;
}

export function ItemDetailScreen({
  onBack,
  onSelectChild,
}: ItemDetailScreenProps) {
  const params = useParams<"id">();
  const id = z.string().parse(params.id);

  const {
    refetch,
    data: { mediaItemById: item },
  } = useSuspenseQuery(GET_MEDIA_ITEM, {
    fetchPolicy: "network-only",
    variables: { mediaItemId: id },
  });

  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  useInput(
    (input, key) => {
      if (input === "r") {
        void refetch();

        return;
      }

      if (key.escape) {
        onBack();
      }
    },
    { isActive: !isActionsMenuVisible },
  );

  const rawActions = [
    createAction(BLACKLIST_ACTIVE_STREAM, {
      appliesTo: ["Movie", "Show", "Season", "Episode"],
      id: "blacklist-active-stream",
      label: "Blacklist active stream",
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
  ] satisfies readonly ItemAction[];

  const children = getChildren(item);
  const contentRating = getContentRating(item);
  const actions = getActionsFor(rawActions, item.__typename);
  const target = {
    id: item.id,
    title: item.fullTitle,
    type: item.__typename,
  } satisfies ActionTarget;

  return (
    <PageWrapper
      header={
        <Box gap={1}>
          <Text bold underline>
            {item.fullTitle}
          </Text>
          <Text dimColor>-</Text>
          <Text dimColor>{item.__typename}</Text>
          <Text dimColor>-</Text>
          <StateBadge state={item.state} />
        </Box>
      }
      footer={<Text dimColor>a actions · r refresh · esc back · q quit</Text>}
      actions={<ActionsMenu actions={actions} target={target} />}
    >
      <Box flexDirection="column" gap={1}>
        <Box>
          {item.posterPath && (
            <Image
              src={item.posterPath}
              alt={`Poster for ${item.fullTitle}`}
              height={20}
              width={40}
            />
          )}
        </Box>
        <Box flexDirection="column">
          {item.__typename === "Movie" ? (
            <DetailRow
              label="TMDb ID"
              value={
                <Link url={`https://www.themoviedb.org/movie/${item.tmdbId}`}>
                  <Text color="blue">{item.tmdbId}</Text>
                </Link>
              }
            />
          ) : (
            <DetailRow
              label="TVDB ID"
              value={
                <Link
                  url={`https://www.thetvdb.com/dereferrer/series/${item.tvdbId}`}
                >
                  <Text color="blue">{item.tvdbId}</Text>
                </Link>
              }
            />
          )}
          {item.imdbId && (
            <DetailRow
              label="IMDb ID"
              value={
                <Link url={`https://www.imdb.com/title/${item.imdbId}`}>
                  <Text color="blue">{item.imdbId}</Text>
                </Link>
              }
            />
          )}
        </Box>
        <Box flexDirection="column">
          <DetailRow label="Year" value={item.year?.toString() ?? "—"} />
          <DetailRow label="Rating" value={item.rating?.toFixed(1) ?? "—"} />
          <DetailRow label="Content rating" value={contentRating ?? "—"} />
          <DetailRow
            label="Release date"
            value={formatDate(item.releaseDate)}
          />
          <DetailRow label="Genres" value={formatList(item.genres)} />
          {item.__typename === "Show" && item.status && (
            <DetailRow label="Status" value={item.status} />
          )}
          {item.__typename === "Movie" && (
            <DetailRow
              label="Runtime"
              value={item.runtime ? `${item.runtime.toString()} min` : "—"}
            />
          )}
          <DetailRow label="Streams" value={item.streams.length.toString()} />
          <DetailRow
            label="Blacklisted"
            value={item.blacklistedStreams.length.toString()}
          />
          <DetailRow
            label="Files"
            value={item.filesystemEntries.length.toString()}
          />
          <DetailRow
            label="Subtitles"
            value={item.subtitles.length.toString()}
          />
          <DetailRow label="Scraped at" value={formatDate(item.scrapedAt)} />
          <DetailRow label="Indexed at" value={formatDate(item.indexedAt)} />
        </Box>
        {children.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>
              {item.__typename === "Show" ? "Seasons" : "Episodes"}
            </Text>
            <SelectList
              items={children}
              getKey={(child) => child.id}
              onSelect={(child) => {
                onSelectChild(child.id);
              }}
              isActive={!isActionsMenuVisible}
              renderItem={(child, isSelected) => (
                <SelectableRow isSelected={isSelected}>
                  {child.type === "Season"
                    ? `Season ${child.number.toString()}`
                    : `Episode ${child.number.toString()}`}{" "}
                  — {child.title} <StateBadge state={child.state} />
                </SelectableRow>
              )}
            />
          </Box>
        )}
      </Box>
    </PageWrapper>
  );
}
