import { EntityRepositoryType, type Opt, type Ref } from "@mikro-orm/core";
import { Entity, ManyToOne, Property } from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";

import { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import { EpisodeRepository } from "../../repositories/episode.repository.ts";
import { Season } from "./season.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";

import type { MediaEntry } from "../filesystem/media-entry.entity.ts";

@Entity({ repository: () => EpisodeRepository })
export class Episode extends ShowLikeMediaItem {
  [EntityRepositoryType]?: EpisodeRepository;

  @Property()
  @Min(0)
  number!: number;

  @Property()
  absoluteNumber!: number;

  @ManyToOne()
  season!: Opt<Ref<Season>>;

  @Property()
  runtime!: number | null;

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
