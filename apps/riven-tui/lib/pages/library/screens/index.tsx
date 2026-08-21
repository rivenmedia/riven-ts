import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import { startTransition, useState } from "react";
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

  const [seenCursors, setSeenCursors] = useState<string[]>([]);
  const [totalItemsSeen, setTotalItemsSeen] = useState(0);

  const navigate = useNavigate();

  const after = seenCursors.at(-2) ?? null;

  const { refetch, data, fetchMore } = useSuspenseQuery(GET_LIBRARY_ITEMS, {
    fetchPolicy: "network-only",
    variables: {
      type: params.type ? [params.type] : ["movie", "show"],
      after,
    },
  });

  if (
    data.mediaItems.endCursor &&
    !seenCursors.includes(data.mediaItems.endCursor)
  ) {
    setSeenCursors((prev) => [...prev, data.mediaItems.endCursor ?? ""]);
    setTotalItemsSeen((prev) => prev + data.mediaItems.length);
  }

  useRefetch(refetch);

  useInput((input) => {
    if (input === "n" && data.mediaItems.hasNextPage) {
      startTransition(async () => {
        await fetchMore({
          updateQuery: (_, { fetchMoreResult }) => fetchMoreResult,
          variables: {
            after: data.mediaItems.endCursor,
          },
        });
      });
    }

    if (input === "p" && data.mediaItems.hasPrevPage) {
      startTransition(() => {
        setSeenCursors((prev) => prev.slice(0, -1));
        setTotalItemsSeen((prev) => prev - data.mediaItems.length);
      });
    }
  });

  return (
    <>
      <Box
        borderBottom
        borderLeft={false}
        borderRight={false}
        borderTop={false}
        borderDimColor
        borderStyle="single"
      >
        <Text dimColor>
          Showing items {totalItemsSeen - data.mediaItems.length + 1}-
          {totalItemsSeen} of {data.mediaItems.totalCount} items
        </Text>
      </Box>
      <SelectList
        items={data.mediaItems.items}
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
    </>
  );
}
