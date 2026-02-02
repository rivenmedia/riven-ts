import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
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
  parent!: Ref<Show>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes = new Collection<Episode>(this);

  override type = "season" as const;
}
