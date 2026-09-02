import { cn } from "@/lib/utils";

import { Film, Tv } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import type { EntertainmentItemData } from "../types";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

const typeStyles = {
  movie: {
    item: "border-orange-500/30 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30",
    icon: "text-orange-400",
    dot: "bg-orange-400",
  },
  episode: {
    item: "border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
    icon: "text-blue-400",
    dot: "bg-blue-400",
  },
  show: {
    item: "border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30",
    icon: "text-purple-400",
    dot: "bg-purple-400",
  },
  season: {
    item: "border-green-500/30 bg-green-500/20 text-green-300 hover:bg-green-500/30",
    icon: "text-green-400",
    dot: "bg-green-400",
  },
} satisfies Record<MediaItemType, { item: string; icon: string; dot: string }>;

function itemUrl(item: EntertainmentItemData) {
  const mediaType = item.itemType === "movie" ? "movie" : "tv";

  switch (item.itemType) {
    case "movie": {
      // For movies, prefer TMDB ID
      if (item.tmdbId) {
        return `/details/media/${item.tmdbId}/${mediaType}` as const;
      }

      if (item.tvdbId) {
        return `/details/media/${item.tvdbId}/${mediaType}?indexer=tvdb` as const;
      }

      break;
    }
    case "show":
    case "season":
    case "episode": {
      // For TV items, prefer TVDB ID to skip TMDB→TVDB resolution
      if (item.tvdbId) {
        return `/details/media/${item.tvdbId}/${mediaType}?indexer=tvdb` as const;
      }

      if (item.tmdbId) {
        return `/details/media/${item.tmdbId}/${mediaType}` as const;
      }

      break;
    }
  }

  return undefined;
}

export interface EntertainmentItemProps {
  item: EntertainmentItemData;
  compact?: boolean;
}

export function EntertainmentItem({ item, compact }: EntertainmentItemProps) {
  const style = typeStyles[item.itemType];

  function renderIcon(size = 4) {
    z.int("EntertainmentItem size must be an integer").parse(size);

    const cls = `h-${size.toFixed(0)} w-${size.toFixed(0)} shrink-0 ${style.icon}`;

    if (item.itemType === "movie") {
      return <Film className={cls} />;
    }
    return <Tv className={cls} />;
  }

  function renderContent() {
    return (
      <>
        {!compact && renderIcon()}
        <div className="min-w-0 flex-1 leading-none">
          <div
            className={cn(
              "min-w-0 text-xs",
              compact ? "truncate font-medium" : "font-semibold",
            )}
          >
            {item.showTitle}{" "}
            {item.season && compact && (
              <>
                S{item.season}
                {item.episode && <>E{item.episode}</>}
              </>
            )}
          </div>
          {item.season && item.episode && !compact && (
            <div className="text-muted-foreground text-xs">
              Season {item.season}
              {item.episode && `, Episode ${item.episode.toString()}`}
            </div>
          )}
        </div>
      </>
    );
  }

  const href = itemUrl(item);

  const classes = cn(
    "group/item flex items-center rounded-md border transition-colors",
    compact ? "gap-1.5 truncate px-2 py-1" : "gap-3 p-2.5",
    style.item,
    item.lastState === "Completed" && "line-through opacity-60",
    href && "no-underline",
  );

  const title = compact
    ? `${item.showTitle} ${item.season ? ` S${item.season.toString()}${item.episode ? `E${item.episode.toString()}` : ""}` : ""}`
    : undefined;

  if (href) {
    return (
      <Link href={href} className={classes} title={title}>
        {compact && (
          <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
        )}
        {renderContent()}
      </Link>
    );
  }

  return (
    <div className={classes} title={title}>
      {compact && (
        <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      )}
      {renderContent()}
    </div>
  );
}
