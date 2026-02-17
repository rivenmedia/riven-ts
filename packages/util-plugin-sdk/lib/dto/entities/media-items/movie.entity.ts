import { Entity, type Hidden, type Opt, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import {
  MovieContentRating,
  MovieContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { MediaItem } from "./media-item.entity.ts";

@ObjectType()
@Entity()
export class Movie extends MediaItem {
  @Field(() => MovieContentRatingEnum)
  declare contentRating: MovieContentRating;

  override type: Opt<"movie"> = "movie" as const;

  declare tmdbId: string;
  declare tvdbId: never;

  getMediaEntries() {
    return this.filesystemEntries.loadItems<MediaEntry>({
      where: {
        type: "media",
      },
      refresh: true,
    });
  }

  @Property({ getter: true })
  get prettyName(): Opt<Hidden<string>> {
    return `${this.title} (${this.year?.toString() ?? "Unknown"}) {tmdb-${this.tmdbId}}`;
  }
}
