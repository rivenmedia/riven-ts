import { Entity } from "@mikro-orm/core";

import { ShowContentRating } from "../../../enums/content-ratings.enum.ts";
import { MediaItem } from "../media-item.entity.ts";

@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
export abstract class ShowLikeMediaItem extends MediaItem {
  declare imdbId?: string | null;
  declare tvdbId: string;
  declare tmdbId?: never;
  declare contentRating: ShowContentRating;
}
