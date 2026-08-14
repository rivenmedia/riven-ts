import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import { DateTime } from "luxon";
import { useState } from "react";
import { useParams } from "react-router";
import { z } from "zod";

import { getActionsFor } from "../../actions/registry.ts";
import { ActionsMenu } from "../../ui/actions-menu.tsx";
import { SelectList } from "../../ui/select-list.tsx";
import { SelectableRow } from "../../ui/selectable-row.tsx";
import { StateBadge } from "../../ui/state-badge.tsx";
import { getChildren } from "./utilities/get-children.ts";
import { getContentRating } from "./utilities/get-content-rating.ts";

import type { ActionTarget } from "../../actions/types.ts";
import type {
  GetMediaItemQuery,
  GetMediaItemQueryVariables,
} from "./item-detail.page.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_MEDIA_ITEM: TypedDocumentNode<
  GetMediaItemQuery,
  GetMediaItemQueryVariables
> = gql`
  query GetMediaItem($id: ID!) {
    mediaItemById(id: $id) {
      __typename
      ... on MediaItem {
        id
        fullTitle
        title
        state
        year
        rating
        releaseDate
        genres
        network
        country
        language
        isAnime
        expectedFileCount
        scrapedAt
        scrapedTimes
        failedScrapeAttempts
        indexedAt
        streams {
          infoHash
        }
        blacklistedStreams {
          plugin
          provider
        }
        filesystemEntries {
          id
          type
        }
        subtitles {
          id
          language
        }
      }
      ... on Movie {
        tmdbId
        movieContentRating: contentRating
        runtime
      }
      ... on ShowLikeMediaItem {
        tvdbId
      }
      ... on Show {
        showContentRating: contentRating
        status
        seasons(includeSpecials: true) {
          id
          title
          number
          state
          totalEpisodes
        }
      }
      ... on Season {
        number
        totalEpisodes
        show {
          id
          title
        }
        episodes {
          id
          title
          number
          state
        }
      }
      ... on Episode {
        number
        absoluteNumber
        show {
          id
          title
        }
        season {
          id
          number
        }
      }
    }
  }
`;

export interface ItemDetailScreenProps {
  onBack: () => void;
  onSelectChild: (id: string) => void;
}

function formatList(values: readonly string[] | null | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "—";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = DateTime.fromISO(value);

  return date.isValid ? date.toFormat("yyyy-LL-dd") : "—";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Box width={18}>
        <Text dimColor>{label}</Text>
      </Box>
      <Text>{value}</Text>
    </Box>
  );
}

export function ItemDetailScreen({
  onBack,
  onSelectChild,
}: ItemDetailScreenProps) {
  const params = useParams();
  const id = z.string().parse(params["id"]);

  const { refetch, data } = useSuspenseQuery(GET_MEDIA_ITEM, {
    variables: { id },
  });

  const [showActions, setShowActions] = useState(false);

  useInput(
    (input, key) => {
      if (input === "r") {
        void refetch();

        return;
      }

      if (input === "a") {
        setShowActions(true);

        return;
      }

      if (key.escape || key.backspace) {
        onBack();
      }
    },
    { isActive: !showActions },
  );

  const { mediaItemById: item } = data;
  const children = getChildren(item);
  const contentRating = getContentRating(item);
  const actions = getActionsFor(item.__typename);
  const target: ActionTarget = {
    id: item.id,
    title: item.fullTitle,
    type: item.__typename,
  };

  return (
    <Box flexDirection="column">
      <Text bold underline>
        {item.fullTitle}
      </Text>
      <Box marginBottom={1}>
        <Text dimColor>{item.__typename}</Text>
        <Text> · </Text>
        <StateBadge state={item.state} />
      </Box>

      <DetailRow label="Year" value={item.year?.toString() ?? "—"} />
      <DetailRow label="Rating" value={item.rating?.toFixed(1) ?? "—"} />
      <DetailRow label="Content rating" value={contentRating ?? "—"} />
      <DetailRow label="Release date" value={formatDate(item.releaseDate)} />
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
      <DetailRow label="Subtitles" value={item.subtitles.length.toString()} />
      <DetailRow label="Scraped at" value={formatDate(item.scrapedAt)} />
      <DetailRow label="Indexed at" value={formatDate(item.indexedAt)} />

      {children.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>
            {item.__typename === "Show" ? "Seasons" : "Episodes"}
          </Text>
          <SelectList
            items={children}
            getKey={(child) => child.id}
            isActive={!showActions}
            onSelect={(child) => {
              onSelectChild(child.id);
            }}
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

      <Box marginTop={1}>
        <Text dimColor>a actions · r refresh · esc back · q quit</Text>
      </Box>

      {showActions && (
        <ActionsMenu
          actions={actions}
          target={target}
          onClose={() => {
            setShowActions(false);
          }}
        />
      )}
    </Box>
  );
}
