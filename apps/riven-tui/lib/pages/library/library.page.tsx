import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import { useNavigate, useParams } from "react-router";

import { MediaItemStateBadge } from "../../ui/media-item-state-badge.tsx";
import { PageWrapper } from "../../ui/page-wrapper/page-wrapper.tsx";
import { SelectList } from "../../ui/select-list.tsx";

import type { MediaItemType } from "../../types/__generated__/graphql.ts";
import type {
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables,
} from "./library.page.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

const GET_LIBRARY_ITEMS: TypedDocumentNode<
  GetLibraryItemsQuery,
  GetLibraryItemsQueryVariables
> = gql`
  query GetLibraryItems($type: [MediaItemType!]!) {
    mediaItems(type: $type) {
      ... on MediaItem {
        id
        fullTitle
        state
      }
    }
  }
`;

export function LibraryScreen() {
  const params = useParams<{
    type?: Extract<MediaItemType, "movie" | "show">;
  }>();

  const navigate = useNavigate();

  const { refetch, data } = useSuspenseQuery(GET_LIBRARY_ITEMS, {
    fetchPolicy: "network-only",
    variables: {
      type: params.type ? [params.type] : ["movie", "show"],
    },
  });

  useInput((input) => {
    if (input === "r") {
      void refetch();
    }
  });

  return (
    <PageWrapper
      header={{
        title: "Media Library",
        content: (
          <Text dimColor>
            {data.mediaItems.length} item
            {data.mediaItems.length === 1 ? "" : "s"}
          </Text>
        ),
      }}
      footer={
        <Text dimColor>
          [↑/↓] navigate · [enter] view · [r] refresh · [q] quit
        </Text>
      }
      tabs={{
        All: "/library",
        Movies: "/library/type/movie",
        Shows: "/library/type/show",
      }}
    >
      <Box flexDirection="column">
        <SelectList
          items={data.mediaItems}
          getKey={(item) => item.id}
          onSelect={(item) => {
            void navigate(`/item/${item.id}`);
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
                <MediaItemStateBadge state={item.state} />
              </Box>
            </Box>
          )}
        />
      </Box>
    </PageWrapper>
  );
}
