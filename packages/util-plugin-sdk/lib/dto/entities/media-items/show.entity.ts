import { Collection, type Opt, type Ref } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";

import { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.ts";
import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { Season } from "./season.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";

import type { MediaItemState } from "../../enums/media-item-state.enum.ts";
import type { ItemRequest } from "../requests/item-request.entity.ts";

@Entity()
export class Show extends ShowLikeMediaItem {
  declare contentRating: ShowContentRating;

  override type: Opt<"show"> = "show" as const;

  declare tvdbId: string;
  declare tmdbId?: never;
  declare itemRequest: Ref<ItemRequest>;
  declare filesystemEntries: never;

  @Enum(() => ShowStatus.enum)
  status!: ShowStatus;

  @OneToMany(() => Season, (season) => season.show)
  seasons = new Collection<Season>(this);

  @OneToMany(() => Season, (season) => season.show, {
    where: { isRequested: true },
  })
  requestedSeasons = new Collection<Season>(this);

  /**
   * The date when the next episode of this show is expected to air.
   *
   * Primarily used internally for scheduling updates.
   */
  @Property()
  nextAirDate!: Date | null;

  getPrettyName(): string {
    return `${this.title} (${this.year?.toString() ?? "Unknown"}) {tvdb-${this.tvdbId}}`;
  }

  getShow() {
    return this;
  }

  async getEpisodes(includeSpecials = false) {
    const seasons = await this.seasons.matching({
      orderBy: { number: "asc" },
      populate: ["episodes"],
      where: {
        ...(!includeSpecials ? { isSpecial: false } : {}),
      },
    });

    return seasons.flatMap((season) => season.episodes.getItems());
  }

  async getStandardSeasons(stateFilter?: MediaItemState[]) {
    return await this.seasons.matching({
      orderBy: { number: "asc" },
      where: {
        ...(stateFilter ? { state: { $in: stateFilter } } : {}),
        isSpecial: false,
      },
    });
  }

  async getSpecialSeason() {
    const [season] = await this.seasons.matching({
      limit: 1,
      where: { isSpecial: true },
    });

    return season;
  }

  async getMediaEntries() {
    const seasons = await this.seasons.matching({
      where: {
        episodes: {
          filesystemEntries: {
            $some: {
              type: "media",
            },
          },
        },
      },
      populate: ["episodes.filesystemEntries"],
      refresh: true,
    });

    const episodes = seasons.flatMap((season) => season.episodes.getItems());

    return episodes.flatMap(
      (episode) =>
        episode.filesystemEntries.filter(
          (entry) => entry.type === "media",
        ) as MediaEntry[],
    );
  }
}
