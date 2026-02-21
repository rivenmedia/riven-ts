import {
  BeforeCreate,
  Entity,
  type Hidden,
  ManyToOne,
  type Opt,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { Season } from "./season.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";

@ObjectType()
@Entity()
export class Episode extends ShowLikeMediaItem {
  @Field()
  @Property()
  @Min(1)
  number!: number;

  @Field(() => Number)
  @Property()
  absoluteNumber!: number;

  @Field(() => Season)
  @ManyToOne()
  season!: Opt<Ref<Season>>;

  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  async getShow() {
    const season = await this.season.loadOrFail({
      populate: ["show"],
    });

    return season.show.loadOrFail();
  }

  @Property({ persist: false, hidden: true, getter: true })
  get prettyName(): Opt<Hidden<string>> {
    const baseName = this.season.getProperty("show").getProperty("prettyName");

    if (!baseName) {
      throw new TypeError(
        "Unable to determine pretty name - missing show prettyName",
      );
    }

    const seasonNumber = this.season
      .getProperty("number")
      .toString()
      .padStart(2, "0");
    const episodeNumber = this.number.toString().padStart(2, "0");

    return `${baseName} - s${seasonNumber}e${episodeNumber}`;
  }

  override type: Opt<"episode"> = "episode" as const;

  declare tvdbId: Opt<string>;
  declare tmdbId?: never;

  getMediaEntries() {
    return this.filesystemEntries.loadItems<MediaEntry>({
      where: {
        type: "media",
      },
      refresh: true,
    });
  }

  @BeforeCreate()
  fallbackToSeasonExternalIds() {
    this.tvdbId ||= this.season.getProperty("tvdbId");
    this.imdbId ??= this.season.getProperty("imdbId") ?? null;
  }
}
