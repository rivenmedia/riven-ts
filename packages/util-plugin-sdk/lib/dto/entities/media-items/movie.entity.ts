import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import {
  MovieContentRating,
  MovieContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { MediaItem } from "./media-item.entity.ts";

import type { ItemRequest } from "../requests/item-request.entity.ts";
import type { Opt, Ref } from "@mikro-orm/core";

@ObjectType()
@Entity()
export class Movie extends MediaItem {
  @Property()
  runtime!: number | null;

  @Field(() => MovieContentRatingEnum)
  declare contentRating: MovieContentRating;

  override type: Opt<"movie"> = "movie" as const;

  declare tmdbId: string;
  declare tvdbId: never;
  declare itemRequest: Ref<ItemRequest>;

  getMediaEntries() {
    return this.filesystemEntries.matching<MediaEntry>({
      where: {
        type: "media",
      },
    });
  }

  getPrettyName(): string {
    return `${this.title} (${this.year?.toString() ?? "Unknown"}) {tmdb-${this.tmdbId}}`;
  }
}
