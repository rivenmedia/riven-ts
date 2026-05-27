import { DownloadKind } from "@repo/util-plugin-sdk/dto/enums/download-kind.enum";

import type { RivenSettings } from "../../../riven-settings.schema.ts";
import type { ProcessMediaItemFlow } from "./process-media-item.schema.ts";
import type { ReadonlyDeep } from "type-fest";

/**
 * Returns the first step for a newly-indexed media item based on the
 * configured download strategy.
 *
 * - "torrent" → "scrape"   (existing torrent pipeline)
 * - "nzb"     → "nzb-scrape" (NZB/Usenet pipeline)
 *
 * Falls back to "scrape" if the strategy value is somehow absent (the
 * RivenSettings schema guarantees a default, so this is belt-and-suspenders).
 */
export function pickInitialStepByStrategy(
  strategy: ReadonlyDeep<RivenSettings>["downloadStrategy"] | undefined,
): Extract<ProcessMediaItemFlow["input"]["step"], "scrape" | "nzb-scrape"> {
  if (strategy === DownloadKind.enum.nzb) {
    return "nzb-scrape";
  }

  return "scrape";
}
