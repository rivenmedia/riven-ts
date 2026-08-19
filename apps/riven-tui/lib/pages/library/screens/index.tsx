import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text } from "ink";
import { useNavigate, useParams } from "react-router";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { MediaItemStateBadge } from "../../../ui/media-item-state-badge.tsx";
import { SelectList } from "../../../ui/select-list.tsx";
import { GET_LIBRARY_ITEMS } from "../queries/get-library-items.query.ts";

import type { MediaItemType } from "../../../types/__generated__/graphql.ts";

export function LibraryScreenIndexScreen() {
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

  useRefetch(refetch);

  return (
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
  );
}
