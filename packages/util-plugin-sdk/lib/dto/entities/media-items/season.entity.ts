import {
  Collection,
  EntityRepositoryType,
  type Opt,
  type Ref,
} from "@mikro-orm/core";
import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import { SeasonRepository } from "../../repositories/season.repository.ts";
import { MediaEntry } from "../filesystem/index.ts";
import { Episode, Show, ShowLikeMediaItem } from "./index.ts";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => SeasonRepository })
export class Season extends ShowLikeMediaItem {
  [EntityRepositoryType]?: SeasonRepository;

  @Field(() => Int)
  @Property()
  @Min(0)
  number!: number;

  @Field(() => Show)
  @ManyToOne()
  show!: Opt<Ref<Show>>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes = new Collection<Episode>(this);

  getPrettyName(): string {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  @Property({ persist: true, hydrate: false })
  get isSpecial(): Opt<boolean> {
    return this.number === 0;
  }

  override type: Opt<"season"> = "season" as const;

  declare tvdbId: Opt<string>;
  declare contentRating: Opt<never>;

  getShow() {
    return this.show.loadOrFail();
  }

  async getMediaEntries() {
    const episodes = await this.episodes.matching({
      where: {
        filesystemEntries: {
          $some: {
            type: "media",
          },
        },
      },
      populate: ["filesystemEntries"],
      refresh: true,
    });

    return episodes.flatMap<MediaEntry>(
      (episode) =>
        episode.filesystemEntries.filter(
          (entry) => entry.type === "media",
        ) as MediaEntry[],
    );
  }

  async getExpectedFileCount(): Promise<number> {
    return this.episodes.loadCount();
  }

  async getIncompleteItems() {
    return this.episodes.matching({
      where: {
        state: ["indexed", "scraped"],
      },
    });
  }
}
