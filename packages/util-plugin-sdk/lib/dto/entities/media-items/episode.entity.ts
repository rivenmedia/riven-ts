import { EntityRepositoryType, type Opt, type Ref } from "@mikro-orm/core";
import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { EpisodeRepository } from "../../repositories/episode.repository.ts";
import { Season, ShowLikeMediaItem } from "./index.ts";

import type { MediaEntry } from "../filesystem/media-entry.entity.ts";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => EpisodeRepository })
export class Episode extends ShowLikeMediaItem {
  [EntityRepositoryType]?: EpisodeRepository;

  @Field(() => Int)
  @Property()
  @Min(0)
  number!: number;

  @Field(() => Int)
  @Property()
  absoluteNumber!: number;

  @Field(() => Season)
  @ManyToOne()
  season!: Opt<Ref<Season>>;

  @Field(() => Int, { nullable: true })
  @Property()
  runtime!: number | null;

  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  async getShow() {
    const season = await this.season.loadOrFail({
      populate: ["show"],
    });

    return season.show.loadOrFail();
  }

  async getPrettyName(): Promise<string> {
    const show = await this.getShow();
    const baseName = show.getPrettyName();

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
    return this.filesystemEntries.matching<MediaEntry>({
      where: { type: "media" },
      refresh: true,
    });
  }
}
