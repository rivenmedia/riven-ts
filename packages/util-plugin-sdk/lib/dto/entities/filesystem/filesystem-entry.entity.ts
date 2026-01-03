import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  TableInheritance,
  UpdateDateColumn,
} from "typeorm";

import { MediaItem } from "../media-items/media-item.entity.ts";

@ObjectType()
@Entity()
@TableInheritance({
  column: {
    type: "varchar",
    name: "type",
  },
})
export class FileSystemEntry {
  @Field((_type) => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ default: 0 })
  fileSize!: number;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field()
  @Column()
  availableInVfs!: boolean;

  @Field(() => MediaItem)
  @ManyToOne(() => MediaItem, (item: MediaItem) => item.id)
  mediaItem!: Relation<MediaItem>;
}
