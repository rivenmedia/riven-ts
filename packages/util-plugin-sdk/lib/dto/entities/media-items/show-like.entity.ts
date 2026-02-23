import { Entity } from "@mikro-orm/core";

import { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import { MediaItem } from "./media-item.entity.ts";

import type { Show } from "./show.entity.ts";
import type { Promisable } from "type-fest";

@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
export abstract class ShowLikeMediaItem extends MediaItem {
  declare tvdbId: string;
  declare tmdbId?: never;
  declare contentRating: ShowContentRating;

  /**
   * Helper method to get the parent show of this media item. For shows, this will return the show itself.
   * For seasons or episodes, it will return the parent show.
   *
   * @returns The parent {@link Show} of this media item.
   */
  abstract getShow(): Promisable<Show>;
}
