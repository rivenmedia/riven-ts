"use client";

import { ListItem } from "@/components/list-item/list-item";

import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { startTransition, useState } from "react";

import { LoadMoreButton } from "./load-more-button";

import type {
  GetDiscoveryItemsQuery,
  GetDiscoveryItemsQueryVariables,
} from "./trending-discovery-item-list.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_DISCOVERY_ITEMS: TypedDocumentNode<
  GetDiscoveryItemsQuery,
  GetDiscoveryItemsQueryVariables
> = gql`
  query GetDiscoveryItems {
    discoveryItems {
      id
      posterPath
      title
      type
      year
    }
  }
`;

interface TrendingDiscoveryItemListProps {
  noItemsFoundMessage: string;
}

export function TrendingDiscoveryItemList({
  noItemsFoundMessage,
}: TrendingDiscoveryItemListProps) {
  const { data, fetchMore } = useSuspenseQuery(GET_DISCOVERY_ITEMS);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  if (data.discoveryItems.length === 0) {
    return <p>{noItemsFoundMessage}</p>;
  }

  return (
    <>
      {data.discoveryItems.map((item) => (
        <div key={item.id} className="aspect-2/3 w-full">
          <ListItem mediaItem={item} indexer="" />
        </div>
      ))}
      <div className="flex justify-center mt-4 col-span-full">
        <LoadMoreButton
          loading={isFetchingMore}
          onLoadMore={() => {
            setIsFetchingMore(true);

            startTransition(async () => {
              await fetchMore({
                updateQuery(previousQueryResult, options) {
                  return {
                    discoveryItems: [
                      ...previousQueryResult.discoveryItems,
                      ...options.fetchMoreResult.discoveryItems,
                    ],
                  };
                },
              });

              setIsFetchingMore(false);
            });
          }}
        />
      </div>
    </>
  );
}
