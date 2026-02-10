import {
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
import { MediaItem } from "./media-item.entity.ts";
import { Show } from "./show.entity.ts";

@ObjectType()
@Entity()
export class Season extends MediaItem {
  @Field()
  @Property()
  @Min(1)
  number!: number;

  @Field(() => Show)
  @ManyToOne()
  parent!: Opt<Ref<Show>>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes = new Collection<Episode>(this);

  override get prettyName(): Opt<string> {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  override type: Opt<"season"> = "season" as const;
}
