import { Collection, EntityRepositoryType } from "@mikro-orm/core";
import {
  Entity,
  Enum,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";
import { reduceAsync } from "es-toolkit";
import { Field, ObjectType } from "type-graphql";

import { ShowContentRatingEnum } from "../../enums/content-ratings.enum.ts";
import { MediaItemState } from "../../enums/media-item-state.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.ts";
import { ShowRepository } from "../../repositories/show.repository.ts";
import { Season, ShowLikeMediaItem } from "./index.ts";

import type { ShowContentRating } from "../../enums/content-ratings.enum.ts";
import type { MediaEntry } from "../filesystem/index.ts";
import type { ItemRequest } from "../requests/item-request.entity.ts";
import type { Opt, Ref } from "@mikro-orm/core";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => ShowRepository })
export class Show extends ShowLikeMediaItem {
  public [EntityRepositoryType]?: ShowRepository;

  @Field(() => ShowContentRatingEnum)
  declare public contentRating: ShowContentRating;

  public override type: Opt<"show"> = "show" as const;

  declare public itemRequest: Ref<ItemRequest>;

  declare public filesystemEntries: never;

  @Field(() => ShowStatus.enum, { nullable: true })
  @Enum(() => ShowStatus.enum)
  public status!: ShowStatus;

  @Field(() => [Season])
  @OneToMany(() => Season, (season) => season.show, {
    orphanRemoval: true,
  })
  public seasons = new Collection<Season>(this);

  @Field(() => [Season])
  @OneToMany(() => Season, (season) => season.show, {
    where: { isRequested: true },
  })
  public requestedSeasons = new Collection<Season>(this);

  /**
   * The date when the next episode of this show is expected to air.
   *
   * Primarily used internally for scheduling updates.
   */
  @Property()
  public nextAirDate!: Date | null;

  public getPrettyName(): string {
    return `${this.title.replaceAll(".", "")} (${this.year?.toString() ?? "Unknown"}) {tvdb-${this.tvdbId}}`;
  }

  public getShow() {
    return this;
  }

  public async getEpisodes(includeSpecials = false) {
    const seasons = await this.seasons.matching({
      orderBy: { number: "asc" },
      populate: ["episodes"],
      where: {
        ...(!includeSpecials && { isSpecial: false }),
      },
    });

    return seasons.flatMap((season) => season.episodes.getItems());
  }

  public async getStandardSeasons(stateFilter?: MediaItemState[]) {
    return this.seasons.matching({
      orderBy: { number: "asc" },
      where: {
        ...(stateFilter && { state: { $in: stateFilter } }),
        isSpecial: false,
      },
    });
  }

  public async getSpecialSeason() {
    const [season] = await this.seasons.matching({
      limit: 1,
      where: { isSpecial: true },
    });

    return season;
  }

  public async getMediaEntries() {
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

  public async getExpectedFileCount(): Promise<number> {
    const processableStates = MediaItemState.exclude(["unreleased"]);

    const seasons = await this.getStandardSeasons(processableStates.options);
    const expectedSeasons =
      this.status === "continuing" ? seasons.length - 1 : seasons.length;

    const count = await reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );

    return count;
  }

  public async getIncompleteItems() {
    return this.seasons.matching({
      where: {
        isRequested: true,
        isSpecial: false,
        episodes: {
          state: ["indexed", "scraped"],
        },
      },
    });
  }

  public async getUnrequestedItems() {
    return this.seasons.matching({
      where: {
        isRequested: false,
        isSpecial: false,
      },
    });
  }
}
