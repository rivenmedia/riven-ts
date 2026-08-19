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
import { Episode } from "./index.js";
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

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.show, {
    orphanRemoval: true,
  })
  public episodes = new Collection<Episode>(this);

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
    return this.episodes.matching({
      orderBy: [
        {
          season: {
            number: "asc",
          },
        },
        { number: "asc" },
      ],
      where: {
        ...(!includeSpecials && { isSpecial: false }),
      },
    });
  }

  public async getUnreleasedEpisodes() {
    return this.episodes.matching({
      where: {
        isRequested: true,
        isSpecial: false,
        state: "unreleased",
        releaseDate: {
          $ne: null,
        },
      },
      orderBy: { releaseDate: "asc nulls last" },
    });
  }

  public async getNextAiringEpisode() {
    const [nextAiringEpisode] = await this.episodes.matching({
      where: {
        isSpecial: false,
        state: "unreleased",
        releaseDate: {
          $ne: null,
        },
      },
      orderBy: { releaseDate: "asc nulls last" },
      limit: 1,
    });

    return nextAiringEpisode ?? null;
  }

  public async getIncompleteEpisodes() {
    return this.episodes.matching({
      where: {
        isRequested: true,
        isSpecial: false,
        state: { $nin: ["completed", "unreleased"] },
      },
      orderBy: { releaseDate: "asc nulls last" },
    });
  }

  public async getIncompleteSeasons() {
    return this.seasons.matching({
      where: {
        isRequested: true,
        isSpecial: false,
        state: { $nin: ["completed", "unreleased"] },
      },
      orderBy: { releaseDate: "asc nulls last" },
    });
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
    const incompleteItems = new Set<Season | Episode>();

    const incompleteSeasons = await this.seasons.matching({
      where: {
        isRequested: true,
        isSpecial: false,
        episodes: {
          state: ["indexed", "scraped"],
        },
      },
    });

    for (const season of incompleteSeasons) {
      const unreleasedEpisodes = await season.getUnreleasedEpisodes();

      if (unreleasedEpisodes.length > 0) {
        // For ongoing seasons, there's no point trying to download a season pack as it won't be available yet.
        // Jump directly to episode-level processing instead.

        const incompleteEpisodes = await season.getIncompleteEpisodes();

        for (const episode of incompleteEpisodes) {
          incompleteItems.add(episode);
        }
      } else {
        incompleteItems.add(season);
      }
    }

    return [...incompleteItems];
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
