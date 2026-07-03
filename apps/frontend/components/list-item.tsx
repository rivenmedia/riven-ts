import { cn } from "@/lib/utils";

import { useMemo } from "react";

import { PortraitCard } from "./media/portrait-card";
import { Badge } from "./ui/badge";

import type { MediaItem } from "./_types/__generated__/graphql";

function CardContent() {
  const badgeVariantClasses: Record<string, string> = {
    success: "bg-green-600/90 text-white border-0",
    error: "bg-red-600/90 text-white border-0",
    default: "bg-yellow-600/90 text-white border-0",
  };

  return (
    <PortraitCard
      title={data.title}
      subtitle={subtitle}
      image={data.poster_path}
      isSelectable={isSelectable}
      isSelected={
        isSelectable && !!data.riven_id && selectStore?.has(data.riven_id)
      }
      onSelectToggle={() => selectStore?.toggle(data.riven_id)}
      topRight={
        data.badge && (
          <Badge
            className={cn(
              "border-white/10 px-2 py-0.5 text-[10px] shadow-sm backdrop-blur-md",
              badgeVariantClasses[data.badge.variant] ||
                badgeVariantClasses["default"],
            )}
          >
            {data.badge.text}
          </Badge>
        )
      }
    />
  );
}

interface ListItemProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  data: MediaItem;
  indexer?: string;
  type?: string;
}

export function ListItem({ className, indexer, type, data }: ListItemProps) {
  // Normalize type for different indexers
  const normalizedType = useMemo(() => {
    let t = type;

    if (indexer === "anilist" && !t) {
      t = data.type;
    }

    if ((indexer === "tvdb" || indexer === "tmdb") && t === "show") {
      t = "tv";
    }

    // Ensure type is set if only in data
    if (!t && data.type) {
      t = data.type;
    }

    return t;
  }, [data.type, indexer, type]);

  const mediaURL = useMemo(() => {
    if (!data.id) {
      return null;
    }

    if (normalizedType === "person" || normalizedType === "company") {
      return `/details/entity/${data.id}/${normalizedType}`;
    }

    if (
      (indexer === "tmdb" || indexer === "tvdb" || indexer === undefined) &&
      (normalizedType === "movie" || normalizedType === "tv")
    ) {
      const params: string[] = [];

      if (indexer === "tvdb") {
        params.push("indexer=tvdb");
      }

      if (data.details_query) {
        for (const [key, value] of Object.entries(data.details_query)) {
          params.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          );
        }
      }
      const queryParam = params.length > 0 ? `?${params.join("&")}` : "";

      // If indexer is undefined, assume tmdb behavior for now as default
      return `/details/media/${data.id}/${normalizedType}${queryParam}`;
    }

    return `/details/${indexer}${normalizedType ? `/${normalizedType}` : ""}/${data.id}`;
  }, []);

  let subtitle = useMemo(() => {
    const parts = [];
    if (data.media_type === "tv" || normalizedType === "tv") parts.push("TV");
    else if (data.media_type === "movie" || normalizedType === "movie")
      parts.push("Movie");
    else if (data.media_type === "person" || normalizedType === "person")
      parts.push("Person");
    else if (data.media_type === "company" || normalizedType === "company")
      parts.push("Studio");

    if (data.year && data.year !== "N/A") {
      parts.push(data.year);
    }
    return parts.join(" • ") || null;
  }, []);

  function getMediaHref(mediaURL: string) {
    const [pathname, search = ""] = mediaURL.split("?");

    if (pathname?.startsWith("/details/media/")) {
      const [, , , id, mediaType] = pathname.split("/");
      const basePath = `/details/media/${id}/${mediaType}`;

      return search ? `${basePath}?${search}` : basePath;
    }

    if (pathname?.startsWith("/details/entity/")) {
      const [, , , id, type] = pathname.split("/");
      return `/details/entity/${id}/${type}`;
    }

    return mediaURL;
  }

  const containerClasses = cn(
    "group relative block w-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
    className,
  );

  if (mediaURL) {
    return (
      <a href={getMediaHref(mediaURL)} className={containerClasses}>
        <CardContent />
      </a>
    );
  }

  return (
    <div
      role="button"
      aria-disabled="true"
      tabIndex={-1}
      className={containerClasses}
    >
      <CardContent />
    </div>
  );
}
