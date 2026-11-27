import { Clapperboard } from "lucide-react";
import Link from "next/link";

import type { JobMediaItem } from "../../../../../_types/job-queue.ts";

export interface MediaItemCardProps {
  mediaItem: JobMediaItem;
}

/** The media item a job works on, with a link to its page. */
export function MediaItemCard({ mediaItem }: MediaItemCardProps) {
  return (
    <section
      aria-labelledby="job-media-item-heading"
      className="bg-card flex min-w-0 items-center gap-3.5 rounded-xl border p-5"
    >
      <div className="bg-muted text-muted-foreground flex h-14 w-10 shrink-0 items-center justify-center rounded-md">
        <Clapperboard aria-hidden="true" className="size-4.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2
          id="job-media-item-heading"
          className="text-muted-foreground text-xs font-medium"
        >
          Media item
        </h2>
        <span className="font-medium">{mediaItem.title}</span>
        {mediaItem.subtitle ? (
          <span className="text-muted-foreground text-sm">
            {mediaItem.subtitle}
          </span>
        ) : null}
      </div>
      <Link
        href={mediaItem.detailsPath}
        className="text-sm whitespace-nowrap underline-offset-4 hover:underline"
      >
        Open item
      </Link>
    </section>
  );
}
