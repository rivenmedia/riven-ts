import {
  BeforeCreate,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  type Opt,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { Episode } from "./episode.entity.ts";
import { ShowLikeMediaItem } from "./interfaces/show-like.interface.ts";
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

  override get prettyName(): Opt<string> {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  override type: Opt<"season"> = "season" as const;

  declare tvdbId: Opt<string>;
  declare tmdbId?: never;
  declare contentRating: Opt<never>;

  @BeforeCreate()
  setTvdbId() {
    this.tvdbId ||= this.show.getProperty("tvdbId");
    this.imdbId ??= this.show.getProperty("imdbId") ?? null;
  }
}
