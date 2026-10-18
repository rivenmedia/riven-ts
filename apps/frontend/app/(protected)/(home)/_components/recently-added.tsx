"use client";

import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { cn } from "cn";

import { fly } from "#components/_animations/fly.ts";
import { ListCarousel } from "#components/list-carousel/list-carousel.tsx";
import { SectionHeading } from "#components/media/section-heading/section-heading.tsx";

import type {
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables,
} from "./recently-added.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { HTMLAttributes } from "react";

export const GET_RECENTLY_ADDED: TypedDocumentNode<
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables
> = gql`
  query GetRecentlyAdded {
    recentlyAdded {
      ... on MediaItem {
        id
        title
        posterPath
        type
        year
      }
    }
  }
`;

export function RecentlyAdded({
  className,
}: Pick<HTMLAttributes<HTMLDivElement>, "className">) {
  const { data } = useQuery(GET_RECENTLY_ADDED);

  if (!data?.recentlyAdded.length) {
    return null;
  }

  const filtered = data.recentlyAdded.filter(
    (item): item is typeof item & { type: TopLevelMediaItemType } =>
      TopLevelMediaItemType.safeParse(item.type).success,
  );

  return (
    <div className={cn("flex flex-col gap-4 delay-100", fly, className)}>
      <SectionHeading title="Recently Added" />
      <ListCarousel items={filtered} indexer="" />
    </div>
  );
}
