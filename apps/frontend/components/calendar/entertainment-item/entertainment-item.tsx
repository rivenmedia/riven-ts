import { cn } from "cn";
import { Film, Tv } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { getTypeStyle } from "#components/calendar/utilities/get-type-style.ts";

import type { EntertainmentItemData } from "#components/calendar/types.d.ts";

function formatEpisodeLabel(item: EntertainmentItemData) {
  if (item.type !== "episode") {
    return "";
  }

  const { seasonNumber, number } = item;

  const episodeLabel = number ? `E${number.toString()}` : "";

  return ` S${seasonNumber.toString()}${episodeLabel}`;
}

function itemUrl(item: EntertainmentItemData) {
  switch (item.type) {
    case "movie":
    case "show": {
      return `/details/media/${item.type}/${item.primaryExternalId}` as const;
    }
    case "season": {
      if (!item.number) {
        throw new Error("Season number is required for season items");
      }

      return `/details/media/show/${item.primaryExternalId}/seasons/${item.number.toString()}` as const;
    }
    case "episode": {
      if (!item.seasonNumber) {
        throw new Error("Season number is required for episode items");
      }

      if (!item.number) {
        throw new Error("Episode number is required for episode items");
      }

      return `/details/media/show/${item.primaryExternalId}/seasons/${item.seasonNumber.toString()}/episodes/${item.number.toString()}` as const;
    }
  }
}

export interface EntertainmentItemProps {
  item: EntertainmentItemData;
  compact?: boolean;
}

/**
 * One calendar release (movie, show, season or episode), styled by type, with a
 * compact variant.
 */
export function EntertainmentItem({ item, compact }: EntertainmentItemProps) {
  const style = getTypeStyle(item.type);

  function renderIcon(size = 4) {
    z.int("EntertainmentItem size must be an integer").parse(size);

    const cls = `h-${size.toFixed(0)} w-${size.toFixed(0)} shrink-0 ${style.icon}`;

    if (item.type === "movie") {
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
            {item.title}{" "}
            {item.type === "episode" && item.seasonNumber && compact && (
              <>
                S{item.seasonNumber}
                {item.number && <>E{item.number}</>}
              </>
            )}
          </div>
          {item.type === "episode" &&
            item.seasonNumber &&
            item.number &&
            !compact && (
              <div className="text-muted-foreground text-xs">
                Season {item.seasonNumber}
                {item.number && `, Episode ${item.number.toString()}`}
              </div>
            )}
        </div>
      </>
    );
  }

  const classes = cn(
    "group/item flex items-center rounded-md border transition-colors",
    compact ? "gap-1.5 truncate px-2 py-1" : "gap-3 p-2.5",
    style.item,
    item.state === "completed" && "line-through opacity-60",
    "no-underline",
  );

  const title = compact
    ? `${item.title} ${formatEpisodeLabel(item)}`
    : undefined;

  return (
    <Link href={itemUrl(item)} className={classes} title={title}>
      {compact && (
        <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      )}
      {renderContent()}
    </Link>
  );
}
