import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { MediaItem } from "../media-items/media-item.entity.ts";

@ObjectType()
@Entity()
export class Stream {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  infoHash!: string;

  @Field()
  @Column()
  rawTitle!: string;

  @Field()
  @Column()
  parsedTitle!: string;

  @Field()
  @Column()
  rank!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  levRatio?: number;

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem)
  parents!: Relation<MediaItem>[];

  @Field(() => [MediaItem])
  @ManyToMany(() => MediaItem)
  blacklistedParents!: Relation<MediaItem>[];
}
