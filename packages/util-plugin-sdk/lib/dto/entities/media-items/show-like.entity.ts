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

  abstract getShow(): Promisable<Show>;
}
