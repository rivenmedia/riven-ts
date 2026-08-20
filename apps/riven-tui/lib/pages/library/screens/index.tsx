import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text, useInput } from "ink";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { MediaItemStateBadge } from "../../../ui/media-item-state-badge.tsx";
import { SelectList } from "../../../ui/select-list.tsx";
import { GET_LIBRARY_ITEMS } from "../queries/get-library-items.query.ts";

import type { MediaItemType } from "../../../types/__generated__/graphql.ts";

export function LibraryScreenIndexScreen() {
  const params = useParams<{
    type?: Extract<MediaItemType, "movie" | "show">;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const limit = 25;

  const { refetch, data } = useSuspenseQuery(GET_LIBRARY_ITEMS, {
    fetchPolicy: "network-only",
    variables: {
      type: params.type ? [params.type] : ["movie", "show"],
      limit,
      page: Number(searchParams.get("page") ?? 1),
    },
  });

  useRefetch(refetch);

  useInput((input) => {
    if (input === "m" && data.mediaItems.length === limit) {
      setSearchParams((search) => {
        const currentPage = Number(search.get("page") ?? 1);

        search.set("page", String(currentPage + 1));

        return search;
      });
    }

    if (input === "n") {
      setSearchParams((search) => {
        const currentPage = Number(search.get("page") ?? 1);

        search.set("page", String(Math.max(currentPage - 1, 1)));

        return search;
      });
    }
  });

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
