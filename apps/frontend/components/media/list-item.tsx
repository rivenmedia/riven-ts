import Link from "next/link";
import { type ComponentProps, useMemo } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "../ui/badge";
import { PortraitCard } from "./portrait-card";

import type { MediaItem } from "@/app/_types/__generated__/graphql";

interface ListItemProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  mediaItem: Pick<MediaItem, "id" | "title" | "posterPath" | "type" | "year">;
  badge?: {
    text: string;
    variant: string;
  };
  indexer?: string;
  isSelectable?: boolean;
}

export function ListItem({
  className,
  badge,
  indexer,
  mediaItem,
  isSelectable = false,
}: ListItemProps) {
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

  const mediaURL: ComponentProps<typeof Link>["href"] | null = useMemo(() => {
    if (!mediaItem.id) {
      return null;
    }

    if (normalisedType === "person" || normalisedType === "company") {
      return `/details/entity/${mediaItem.id}/${normalisedType}`;
    }

    if (
      (indexer === "tmdb" || indexer === "tvdb" || indexer === undefined) &&
      (normalisedType === "movie" || normalisedType === "tv")
    ) {
      const params: string[] = [];

      if (indexer === "tvdb") {
        params.push("indexer=tvdb");
      }

      if (mediaItem.details_query) {
        for (const [key, value] of Object.entries(mediaItem.details_query)) {
          params.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          );
        }
      }
      const queryParam = params.length > 0 ? `?${params.join("&")}` : "";

      // If indexer is undefined, assume tmdb behavior for now as default
      return `/details/media/${mediaItem.id}/${normalisedType}${queryParam}`;
    }

    return `/details/${indexer}${normalisedType ? `/${normalisedType}` : ""}/${mediaItem.id}`;
  }, [mediaItem.id, mediaItem.details_query, indexer, normalisedType]);

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
        image={mediaItem.posterPath ?? null}
        isSelectable={isSelectable}
        // isSelected={
        //   isSelectable && !!data.riven_id && selectStore?.has(data.riven_id)
        // }
        // onSelectToggle={() => selectStore?.toggle(data.riven_id)}
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

  if (mediaURL) {
    return (
      <Link href={mediaURL} className={containerClasses}>
        {renderCardContent()}
      </Link>
    );
  }

  return (
    <div
      role="button"
      aria-disabled="true"
      tabIndex={-1}
      className={containerClasses}
    >
      {renderCardContent()}
    </div>
  );
}
