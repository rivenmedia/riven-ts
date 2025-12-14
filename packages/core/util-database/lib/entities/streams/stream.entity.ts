import { MediaItem } from "../media-items/media-item.entity.ts";
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

@Entity()
export class Stream {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  infoHash!: string;

  @Column()
  rawTitle!: string;

  @Column()
  parsedTitle!: string;

  @Column()
  rank!: number;

  @Column({ nullable: true })
  levRatio?: number;

  @ManyToMany(() => MediaItem)
  parents!: Relation<MediaItem>[];

  @ManyToMany(() => MediaItem)
  blacklistedParents!: Relation<MediaItem>[];
}
