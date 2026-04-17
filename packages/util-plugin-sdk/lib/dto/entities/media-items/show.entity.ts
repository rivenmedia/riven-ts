import {
  Collection,
  EntityRepositoryType,
  type Opt,
  type Ref,
} from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Field, ObjectType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.ts";
import { ShowRepository } from "../../repositories/show.repository.ts";
import { MediaEntry } from "../filesystem/index.ts";
import { Season, ShowLikeMediaItem } from "./index.ts";

import type { ItemRequest } from "../requests/item-request.entity.ts";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => ShowRepository })
export class Show extends ShowLikeMediaItem {
  [EntityRepositoryType]?: ShowRepository;

  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  override type: Opt<"show"> = "show" as const;

  declare itemRequest: Ref<ItemRequest>;

  declare filesystemEntries: never;

  @Field(() => ShowStatus.enum, { nullable: true })
  @Enum(() => ShowStatus.enum)
  status!: ShowStatus;

  @Field(() => [Season])
  @OneToMany(() => Season, (season) => season.show)
  seasons = new Collection<Season>(this);

  @Field(() => [Season])
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

  async getExpectedFileCount(): Promise<number> {
    const { reduceAsync } = await import("es-toolkit");

    const processableStates = MediaItemState.exclude(["unreleased", "ongoing"]);

    const seasons = await this.getStandardSeasons(processableStates.options);
    const expectedSeasons =
      this.status === "continuing" ? seasons.length - 1 : seasons.length;

    return reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );
  }
}
