import { EntityRepositoryType } from "@mikro-orm/core";
import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import { ShowContentRatingEnum } from "../../enums/content-ratings.enum.ts";
import { EpisodeRepository } from "../../repositories/episode.repository.ts";
import { Season, ShowLikeMediaItem } from "./index.ts";

import type { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import type { MediaEntry } from "../filesystem/media-entry.entity.ts";
import type { Opt, Ref } from "@mikro-orm/core";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => EpisodeRepository })
export class Episode extends ShowLikeMediaItem {
  public [EntityRepositoryType]?: EpisodeRepository;

  @Field(() => Int)
  @Property()
  @Min(0)
  public number!: number;

  @Field(() => Int)
  @Property()
  public absoluteNumber!: number;

  @Field(() => Season)
  @ManyToOne()
  public season!: Opt<Ref<Season>>;

  @Field(() => Int, { nullable: true })
  @Property()
  public runtime!: number | null;

  @Field(() => ShowContentRatingEnum)
  declare public contentRating: ShowContentRating;

  public async getShow() {
    const season = await this.season.loadOrFail({
      populate: ["show"],
    });

    return season.show.loadOrFail();
  }

  public async getPrettyName(): Promise<string> {
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

  public override type: Opt<"episode"> = "episode" as const;

  declare public tvdbId: Opt<string>;

  public async getMediaEntries() {
    return this.filesystemEntries.matching<MediaEntry>({
      where: { type: "media" },
      refresh: true,
    });
  }

  public getExpectedFileCount(): number {
    return 1;
  }

  public getIncompleteItems() {
    return [];
  }
}
