import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import {
  ChildEntity,
  Column,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";

import { Episode } from "./episode.entity.ts";
import { MediaItem } from "./media-item.entity.ts";
import { Show } from "./show.entity.ts";

@ObjectType()
@ChildEntity()
export class Season extends MediaItem {
  @Field()
  @Column()
  @Min(1)
  number!: number;

  @Field(() => Show)
  @ManyToOne(() => Show, (show) => show.seasons)
  parent!: Relation<Show>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes!: Relation<Episode>[];
}
