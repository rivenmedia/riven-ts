"use client";

import { cn } from "cn";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "#components/_ui/badge.tsx";
import { PortraitCard } from "#components/portrait-card/portrait-card.tsx";
import { useCardSelection } from "#components/providers/card-selection-provider.tsx";

import type { IndexerData } from "#app/_types/__generated__/graphql.ts";
import type { LinkProps } from "next/link";

interface ListItemProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  mediaItem: Pick<IndexerData, "id" | "title" | "posterUrl" | "type" | "year">;
  badge?: {
    text: string;
    variant: string;
  };
  indexer: string | undefined;
  isSelectable?: boolean;
  href?: LinkProps<`/details/media/${string}/${string}`>["href"];
}

export function ListItem({
  className,
  badge,
  indexer,
  mediaItem,
  isSelectable = false,
  href,
}: ListItemProps) {
  const cardSelectionContext = useCardSelection();

  if (isSelectable && !cardSelectionContext) {
    throw new Error(
      "ListItem must be used within a CardSelectionProvider when isSelectable is true",
    );
  }

  // Normalize type for different indexers
  const normalisedType = useMemo(() => {
    if (
      (indexer === "tvdb" || indexer === "tmdb") &&
      mediaItem.type === "show"
    ) {
      return "tv";
    }

    return mediaItem.type;
  }, [mediaItem.type, indexer]);

  const subtitle = useMemo(() => {
    const parts = [];

    if ([mediaItem.type, normalisedType].includes("tv")) {
      parts.push("TV");
    } else if ([mediaItem.type, normalisedType].includes("movie")) {
      parts.push("Movie");
    } else if ([mediaItem.type, normalisedType].includes("person")) {
      parts.push("Person");
    } else if ([mediaItem.type, normalisedType].includes("company")) {
      parts.push("Studio");
    }

    if (mediaItem.year) {
      parts.push(mediaItem.year);
    }

    return parts.join(" • ") || null;
  }, [mediaItem.type, mediaItem.year, normalisedType]);

  const containerClasses = cn(
    "group relative block w-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
    className,
  );

  function renderCardContent() {
    const badgeVariantClasses: Record<string, string> = {
      success: "bg-green-600/90 text-white border-0",
      error: "bg-red-600/90 text-white border-0",
      default: "bg-yellow-600/90 text-white border-0",
    };

    return (
      <PortraitCard
        title={mediaItem.title}
        subtitle={subtitle}
        image={mediaItem.posterUrl ?? null}
        {...(isSelectable &&
          cardSelectionContext && {
            isSelectable: true,
            isSelected: cardSelectionContext.selectedItems.has(mediaItem.id),
            onSelectToggle: () => {
              cardSelectionContext.toggleItemSelection(mediaItem.id);
            },
          })}
        topRight={
          badge && (
            <Badge
              className={cn(
                "border-white/10 px-2 py-0.5 text-[10px] shadow-sm backdrop-blur-md",
                badgeVariantClasses[badge.variant] ??
                  badgeVariantClasses["default"],
              )}
            >
              {badge.text}
            </Badge>
          )
        }
      />
    );
  }

  if (href) {
    return (
      <Link href={href} className={containerClasses}>
        {renderCardContent()}
      </Link>
    );
  }

  return (
    <div aria-disabled="true" tabIndex={-1} className={containerClasses}>
      {renderCardContent()}
    </div>
  );
}
