import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Spacer, Text, useInput } from "ink";

import { SelectList } from "../../ui/select-list.tsx";
import { StateBadge } from "../../ui/state-badge.tsx";

import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "./library.page.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_LIBRARY_ITEMS: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems(
    $type: [MediaItemType!]!
    $includeUnrequestedItems: Boolean = false
  ) {
    mediaItems(type: $type, includeUnrequestedItems: $includeUnrequestedItems) {
      ... on MediaItem {
        id
        fullTitle
        state
      }
    }
  }
`;

export interface LibraryScreenProps {
  onSelectItem: (id: string) => void;
}

export function LibraryScreen({ onSelectItem }: LibraryScreenProps) {
  const { refetch, data } = useSuspenseQuery(GET_LIBRARY_ITEMS, {
    fetchPolicy: "network-only",
    variables: {
      type: ["movie", "show"],
      includeUnrequestedItems: false,
    },
  });

  useInput((input) => {
    if (input === "r") {
      void refetch();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold underline>
        Library
      </Text>
      <Box flexDirection="column" maxWidth={80}>
        <SelectList
          items={data.mediaItems}
          getKey={(item) => item.id}
          onSelect={(item) => {
            onSelectItem(item.id);
          }}
          emptyMessage="Your library is empty."
          renderItem={(item, isSelected) => (
            <Box width="100%" justifyContent="space-between">
              <Text color={isSelected ? "cyan" : "white"}>
                {isSelected ? "❯ " : "  "}
                {item.fullTitle}
              </Text>
              <Box>
                <Text>{item.__typename}</Text>
                <Text> · </Text>
                <StateBadge state={item.state} />
              </Box>
            </Box>
          )}
        />
        <Box marginTop={1}>
          <Text dimColor>
            {data.mediaItems.length} item
            {data.mediaItems.length === 1 ? "" : "s"} · ↑/↓ navigate · enter
            view · r refresh · q quit
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
