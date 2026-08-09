import { Box, Text, useInput } from "ink";
import { DateTime } from "luxon";
import { useState } from "react";

import { getActionsFor } from "../../actions/registry.ts";
import { useMediaItem } from "../../hooks/use-media-item.ts";
import { getChildren, getContentRating } from "../../media-item-detail.ts";
import { ActionsMenu } from "../actions-menu.tsx";
import { ErrorMessage } from "../error-message.tsx";
import { LoadingIndicator } from "../loading-indicator.tsx";
import { SelectList } from "../select-list.tsx";
import { SelectableRow } from "../selectable-row.tsx";
import { StateBadge } from "../state-badge.tsx";

import type { ActionTarget } from "../../actions/types.ts";
import type { GraphqlClient } from "../../graphql/graphql-client.ts";

export interface ItemDetailScreenProps {
  client: GraphqlClient;
  id: string;
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
  client,
  id,
  onBack,
  onSelectChild,
}: ItemDetailScreenProps) {
  const { state, refetch } = useMediaItem(client, id);
  const [showActions, setShowActions] = useState(false);

  useInput(
    (input, key) => {
      if (input === "r") {
        refetch();

        return;
      }

      if (input === "a" && state.status === "success") {
        setShowActions(true);

        return;
      }

      if (key.escape || key.backspace) {
        onBack();
      }
    },
    { isActive: !showActions },
  );

  if (state.status === "loading") {
    return <LoadingIndicator label="Loading item" />;
  }

  if (state.status === "error") {
    return <ErrorMessage error={state.error} />;
  }

  const item = state.data;
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
      {item.__typename === "Show" && item.status ? (
        <DetailRow label="Status" value={item.status} />
      ) : null}
      {item.__typename === "Movie" ? (
        <DetailRow
          label="Runtime"
          value={item.runtime ? `${item.runtime.toString()} min` : "—"}
        />
      ) : null}
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
