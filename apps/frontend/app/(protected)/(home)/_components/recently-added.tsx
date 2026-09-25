import { fly } from "@/components/_animations/fly";
import { ListCarousel } from "@/components/list-carousel/list-carousel";
import { SectionHeading } from "@/components/media/section-heading/section-heading";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { cn } from "cn";

import type {
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables,
} from "./recently-added.typegen";
import type { TypedDocumentNode } from "@apollo/client";
import type { HTMLAttributes } from "react";

export const GET_RECENTLY_ADDED: TypedDocumentNode<
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables
> = gql`
  query GetRecentlyAdded {
    recentlyAdded {
      id
      title
      posterPath
      type
      year
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

  return (
    <div className={cn("flex flex-col gap-4 delay-100", fly, className)}>
      <SectionHeading title="Recently Added" />
      <ListCarousel items={data.recentlyAdded} indexer="" />
    </div>
  );
}
