import { Collection, type Opt, type Ref } from "@mikro-orm/core";
import {
  Entity,
  ManyToOne,
  OneToMany,
  Property,
} from "@mikro-orm/decorators/legacy";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { Episode } from "./episode.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";
import { Show } from "./show.entity.ts";

@ObjectType({ implements: ShowLikeMediaItem })
@Entity()
export class Season extends ShowLikeMediaItem {
  declare filesystemEntries: never;

  @Field()
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
  declare tmdbId?: never;
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
}
