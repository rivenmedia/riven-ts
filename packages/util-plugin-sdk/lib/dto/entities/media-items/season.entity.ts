import {
  BeforeCreate,
  Collection,
  Entity,
  type Hidden,
  ManyToOne,
  OneToMany,
  type Opt,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { MediaEntry } from "../filesystem/media-entry.entity.js";
import { Episode } from "./episode.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";
import { Show } from "./show.entity.ts";

@ObjectType()
@Entity()
export class Season extends ShowLikeMediaItem {
  @Field()
  @Property()
  @Min(1)
  number!: number;

  @Field(() => Show)
  @ManyToOne()
  show!: Opt<Ref<Show>>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes = new Collection<Episode>(this);

  getShowTitle() {
    return this.show.loadProperty("title");
  }

  @Property({ persist: false, hidden: true, getter: true })
  get prettyName(): Opt<Hidden<string>> {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  override type: Opt<"season"> = "season" as const;

  declare tvdbId: Opt<string>;
  declare tmdbId?: never;
  declare contentRating: Opt<never>;

  async getMediaEntries() {
    const episodes = await this.episodes.loadItems({
      where: {
        filesystemEntries: {
          $some: {
            type: "media",
          },
        },
      },
      fields: ["filesystemEntries"],
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

  @BeforeCreate()
  setTvdbId() {
    this.tvdbId ||= this.show.getProperty("tvdbId");
    this.imdbId ??= this.show.getProperty("imdbId") ?? null;
  }
}
