import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { IsNumberString } from "class-validator";
import { Field, InterfaceType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaItem } from "./index.ts";

import type { Show } from "./show.entity.ts";
import type { Promisable } from "type-fest";

@InterfaceType({ implements: MediaItem })
@Entity({
  abstract: true,
  discriminatorColumn: "type",
})
export abstract class ShowLikeMediaItem extends MediaItem {
  @Field(() => String)
  @Property()
  @IsNumberString()
  tvdbId!: string;

  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  /**
   * Helper method to get the parent show of this media item. For shows, this will return the show itself.
   * For seasons or episodes, it will return the parent show.
   *
   * @returns The parent {@link Show} of this media item.
   */
  abstract getShow(): Promisable<Show>;
}
