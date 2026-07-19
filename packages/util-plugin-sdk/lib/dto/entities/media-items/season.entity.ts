import { Collection, EntityRepositoryType } from "@mikro-orm/core";
import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import { SeasonRepository } from "../../repositories/season.repository.ts";
import { Episode, Show, ShowLikeMediaItem } from "./index.ts";

import type { MediaEntry } from "../filesystem/index.ts";
import type { Opt, Ref } from "@mikro-orm/core";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity({ repository: () => SeasonRepository })
export class Season extends ShowLikeMediaItem {
  public [EntityRepositoryType]?: SeasonRepository;

  @Field(() => Int)
  @Property()
  @Min(0)
  public number!: number;

  @Field(() => Show)
  @ManyToOne()
  public show!: Opt<Ref<Show>>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  public episodes = new Collection<Episode>(this);

  public getPrettyName(): string {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  @Property({ persist: true, hydrate: false })
  public get isSpecial(): Opt<boolean> {
    return this.number === 0;
  }

  public override type: Opt<"season"> = "season" as const;

  declare public tvdbId: Opt<string>;
  declare public contentRating: Opt<never>;

  public async getShow() {
    return this.show.loadOrFail();
  }

  public async getMediaEntries() {
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

  public async getExpectedFileCount(): Promise<number> {
    return this.episodes.loadCount();
  }

  public async getIncompleteItems() {
    return this.episodes.matching({
      where: {
        state: ["indexed", "scraped"],
      },
    });
  }
}
